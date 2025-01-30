import {
  DynamicModule,
  Inject,
  Injectable,
  Module,
  OnModuleInit,
} from "@nestjs/common";
import { DiscoveryModule, DiscoveryService, Reflector } from "@nestjs/core";
import { MetadataScanner } from "@nestjs/core/metadata-scanner";
import { Resolver } from "@nestjs/graphql";
import { getTableName, Relations } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { createOneGenerator } from "./generators/createOne.generator";
import { getManyGenerator } from "./generators/getMany.generator";
import { getOneGenerator } from "./generators/getOne.generator";
import {
  generateGraphQLType,
  generateGetManyInputType,
} from "./generators/types/type.generator";
import { updateOneGenerator } from "./generators/updateOne.generator";
import { AutoCrudConfig } from "./types/config.types";
import { extractSchemaRepresentation } from "./utils/extractSchema.utils";
import { Wrapper } from "./types/wrapper.type";
import { Model } from "./types/model.types";
import { SchemaTypes } from "./types/registry.types";
import { generateRelations } from "./generators/relations.generator";
import { deleteOneGenerator } from "./generators/deleteOne.generator";
import {
  AUTO_CRUD_RESOLVER_KEY,
  AUTO_CRUD_WRAP_RESOLVER_KEY,
  AUTOCRUD_OPTIONS,
  DRIZZLE_ORM_INJECTION_KEY,
} from "./constant";

interface AutoCrudOptions {
  schema: Record<string, PgTable | Relations>;
}

@Injectable()
export class AutoCrudService implements OnModuleInit {
  private readonly extractedSchema: Model[];
  private readonly typeRegistry: SchemaTypes = {};

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly reflector: Reflector,
    private readonly metadataScanner: MetadataScanner,
    @Inject(AUTOCRUD_OPTIONS)
    private readonly globalOptions: AutoCrudOptions,
    @Inject(DRIZZLE_ORM_INJECTION_KEY)
    private readonly drizzleOrm: PostgresJsDatabase
  ) {
    this.extractedSchema = extractSchemaRepresentation(
      this.globalOptions.schema
    );
  }

  onModuleInit() {
    const providers = this.discovery.getProviders();
    const registeredProviders = this.getRegisteredProviders(providers);

    this.initializeTypeRegistry(registeredProviders);
    this.enhanceResolvers(registeredProviders);
  }

  private getRegisteredProviders(providers: any[]) {
    return providers
      .map((wrapper) => {
        if (!wrapper.metatype) return null;
        const config = this.reflector.get(
          AUTO_CRUD_RESOLVER_KEY,
          wrapper.metatype
        );
        if (!config) return null;

        const tableName = getTableName(config.schema);
        const model = this.extractedSchema.find(
          (m) => m.dbTableName === tableName
        );

        if (!model) {
          throw new Error(`Model not found for table ${tableName}`);
        }

        return { wrapper, config, model };
      })
      .filter(Boolean);
  }

  private initializeTypeRegistry(registeredProviders: any[]) {
    registeredProviders.forEach(({ model, wrapper }) => {
      this.typeRegistry[model.name] = {
        baseType: generateGraphQLType(model),
        getManyInputType: generateGetManyInputType(model),
      };
      (wrapper.metatype as any).objectType =
        this.typeRegistry[model.name].baseType;
    });
  }

  private enhanceResolvers(registeredProviders: any[]) {
    registeredProviders.forEach(({ wrapper, config }) => {
      const wrappers = this.getMethodWrappers(wrapper);
      this.enhanceResolver(wrapper.metatype, config, wrappers);
    });
  }

  private getMethodWrappers(wrapper: any): Record<string, Wrapper> {
    const wrappers: Record<string, Wrapper> = {};

    if (!wrapper.instance) return wrappers;

    const methods = this.metadataScanner.getAllMethodNames(
      Object.getPrototypeOf(wrapper.instance)
    );

    methods.forEach((method) => {
      const methodRef = wrapper.instance[method];
      const wrapMetadata = this.reflector.get(
        AUTO_CRUD_WRAP_RESOLVER_KEY,
        methodRef
      );

      if (wrapMetadata) {
        wrappers[method] = methodRef;
      }
    });

    return wrappers;
  }

  private enhanceResolver(
    target: any,
    config: AutoCrudConfig,
    wrappers: Record<string, Wrapper>
  ) {
    const tableName = getTableName(config.schema);
    const model = this.extractedSchema.find((m) => m.dbTableName === tableName);

    if (!model) {
      throw new Error(`Model not found for table ${tableName}`);
    }

    const { baseType: objectType, getManyInputType: inputType } =
      this.typeRegistry[model.name];

    // Apply the resolver decorator
    Resolver(() => objectType)(target);

    // Generate resolvers
    getOneGenerator(target, model, objectType, this.drizzleOrm, wrappers);
    getManyGenerator(
      target,
      model,
      objectType,
      inputType,
      this.drizzleOrm,
      wrappers
    );
    createOneGenerator(target, model, objectType, this.drizzleOrm, wrappers);
    updateOneGenerator(target, model, this.drizzleOrm, wrappers);
    deleteOneGenerator(target, model, this.drizzleOrm, wrappers);

    // add relation fields
    generateRelations(target, model, this.typeRegistry);
  }
}

@Module({
  imports: [DiscoveryModule],
  providers: [AutoCrudService],
  exports: [AutoCrudService],
})
export class AutoCrudModule {
  static forRoot(options: AutoCrudOptions): DynamicModule {
    if (!options.schema || Object.keys(options.schema).length === 0) {
      throw new Error("Schema configuration is required and cannot be empty");
    }

    return {
      module: AutoCrudModule,
      imports: [DiscoveryModule],
      providers: [
        {
          provide: AUTOCRUD_OPTIONS,
          useValue: options,
        },
        AutoCrudService,
      ],
      exports: [AutoCrudService],
    };
  }
}
