import { Args, Field, InputType, Mutation } from '@nestjs/graphql';
import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { Model } from '../types/model.types';
import { Wrapper } from '../types/wrapper.type';
import { toCamelCase } from '../utils/string.utils';
import { mapDrizzleToGraphQLType } from '../utils/type-mapping.utils';

export function updateOneGenerator(
  target: any,
  model: Model,
  db: PostgresJsDatabase,
  wrappers: Record<string, Wrapper>,
) {
  const queryName = toCamelCase(model.name, 'updateOne');
  const queryInputTypeName = toCamelCase(queryName, 'inputType');
  const primaryKey = model.primaryKey;

  @InputType(toCamelCase(queryInputTypeName, 'payloadType'))
  class UpdateInputPayloadType {
    static {
      for (const { name, drizzleField } of model.fields) {
        Field(() => mapDrizzleToGraphQLType(drizzleField.dataType), {
          nullable: true,
        })(UpdateInputPayloadType.prototype, name);
      }
    }
  }

  @InputType(queryInputTypeName)
  class UpdateInputType {
    static _fields: { [key: string]: any } = {};

    static {
      Field(() => mapDrizzleToGraphQLType(primaryKey.drizzleField.dataType), {
        nullable: false,
      })(UpdateInputType.prototype, primaryKey.name);

      Field(() => UpdateInputPayloadType, {
        nullable: false,
      })(UpdateInputType.prototype, 'payload');
    }
  }

  const updateOneMutation = async (input) => {
    const results = await db
      .update(model.drizzleTable)
      .set(input.payload)
      .where(eq(model.drizzleTable[primaryKey.name], input.id))
      .returning();
    return results.length === 1;
  };

  target.prototype[queryName] = async function (input) {
    if (wrappers.updateOne) {
      return wrappers.updateOne(updateOneMutation, input);
    }
    return updateOneMutation(input);
  };

  Reflect.defineMetadata('design:type', Function, target.prototype, queryName);

  Reflect.defineMetadata(
    'design:paramtypes',
    [UpdateInputType],
    target.prototype,
    queryName,
  );

  Reflect.defineMetadata(
    'design:returntype',
    Promise,
    target.prototype,
    queryName,
  );

  Args('input', { type: () => UpdateInputType, nullable: false })(
    target.prototype,
    queryName,
    0,
  );

  Mutation(() => Boolean, {
    name: queryName,
  })(
    target.prototype,
    queryName,
    Object.getOwnPropertyDescriptor(target.prototype, queryName),
  );
}
