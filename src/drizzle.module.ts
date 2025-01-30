import { DynamicModule, Global, Module } from "@nestjs/common";
import { DRIZZLE_ORM_INJECTION_KEY } from "./constant";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";

export interface DrizzleModuleOptions {
  client: PostgresJsDatabase;
}

@Global()
@Module({})
export class DrizzleModule {
  static forRoot(options: DrizzleModuleOptions): DynamicModule {
    return {
      module: DrizzleModule,
      providers: [
        {
          provide: DRIZZLE_ORM_INJECTION_KEY,
          useValue: options.client,
        },
      ],
      exports: [DRIZZLE_ORM_INJECTION_KEY],
    };
  }
}
