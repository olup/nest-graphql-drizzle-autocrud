import { Args, Field, Info, InputType, Mutation } from '@nestjs/graphql';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { Model } from '../types/model.types';
import { Wrapper } from '../types/wrapper.type';
import { infoNodeToWithRelation } from '../utils/query.utils';
import { toCamelCase } from '../utils/string.utils';
import { mapDrizzleToGraphQLType } from '../utils/type-mapping.utils';

export function generateCreateInputType(model: Model) {
  const typeName = toCamelCase(model.name, 'createInputType');

  @InputType(typeName)
  class CreateInputType {
    static _fields: { [key: string]: any } = {};

    static {
      for (const { name, drizzleField: originalField, type } of model.fields) {
        const fieldName = name;
        const fieldType = mapDrizzleToGraphQLType(type);
        const nullable = !originalField.notNull || originalField.hasDefault;

        Field(() => fieldType, {
          nullable,
        })(CreateInputType.prototype, fieldName);
      }
    }
  }

  return CreateInputType;
}

export function createOneGenerator(
  target: any,
  model: Model,
  objectType: any,
  db: PostgresJsDatabase,
  wrappers: Record<string, Wrapper>,
) {
  const createMutationName = toCamelCase(model.name, 'createOne');
  const createInputType = generateCreateInputType(model);

  target.prototype[createMutationName] = async function (input, info) {
    const queryMap = infoNodeToWithRelation(info.fieldNodes[0], model); // TODO

    const createOneMutation = async (input) => {
      const [result] = await db
        .insert(model.drizzleTable)
        .values(input)
        .returning();

      return db.query[model.name].findFirst({
        where: (t, { eq }) =>
          eq(t[model.primaryKey.name], result[model.primaryKey.name]),
        with: queryMap,
      });
    };

    if (wrappers.createOne) {
      return wrappers.createOne(createOneMutation, input);
    }
    return createOneMutation(input);
  };

  Reflect.defineMetadata(
    'design:paramtypes',
    [createInputType],
    target.prototype,
    createMutationName,
  );

  Args('input', { type: () => createInputType, nullable: false })(
    target.prototype,
    createMutationName,
    0,
  );

  Info()(target.prototype, createMutationName, 1);

  Mutation(() => objectType, {
    name: createMutationName,
  })(
    target.prototype,
    createMutationName,
    Object.getOwnPropertyDescriptor(target.prototype, createMutationName),
  );
}
