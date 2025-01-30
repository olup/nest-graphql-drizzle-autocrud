import { Args, Field, InputType, Mutation } from '@nestjs/graphql';
import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { Model } from '../types/model.types';
import { Wrapper } from '../types/wrapper.type';
import { toCamelCase } from '../utils/string.utils';
import { mapDrizzleToGraphQLType } from '../utils/type-mapping.utils';

export function deleteOneGenerator(
  target: any,
  model: Model,
  db: PostgresJsDatabase,
  wrappers: Record<string, Wrapper>,
) {
  const queryName = toCamelCase(model.name, 'deleteOne');
  const queryInputTypeName = toCamelCase(queryName, 'inputType');

  @InputType(queryInputTypeName)
  class DeleteOneInputType {
    static _fields: { [key: string]: any } = {};
    static {
      Field(() => mapDrizzleToGraphQLType(model.primaryKey.type), {
        nullable: false,
      })(DeleteOneInputType.prototype, model.primaryKey.name);
    }
  }

  const deleteOneMutation = async (input) => {
    const results = await db
      .delete(model.drizzleTable)
      .where(eq(model.primaryKey.drizzleField, input[model.primaryKey.name]))
      .returning();
    return results.length === 1;
  };

  target.prototype[queryName] = async function (input) {
    if (wrappers.deleteOne) {
      return wrappers.deleteOne(deleteOneMutation, input);
    }
    return deleteOneMutation(input);
  };

  Reflect.defineMetadata(
    'design:paramtypes',
    [DeleteOneInputType],
    target.prototype,
    queryName,
  );

  Args('input', { type: () => DeleteOneInputType, nullable: false })(
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
