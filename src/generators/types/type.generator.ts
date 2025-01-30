import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { Model, RelationRepresentation } from '../../types/model.types';
import { toCamelCase } from '../../utils/string.utils';
import {
  mapDrizzleToGraphQLType,
  mapGraphQLTypeToFilterType,
} from '../../utils/type-mapping.utils';

export function generateGraphQLType(model: Model) {
  const typeName = toCamelCase(model.name, 'objectType');

  @ObjectType(typeName)
  class GeneratedType {
    static {
      for (const { name, type, drizzleField } of model.fields) {
        const fieldName = name;
        const fieldType = mapDrizzleToGraphQLType(type);

        Field(() => fieldType, {
          nullable: drizzleField.nullable,
        })(GeneratedType.prototype, toCamelCase(fieldName));
      }
    }
  }

  return GeneratedType;
}

export function generateGetManyInputType(model: Model) {
  // input types
  @InputType(toCamelCase(model.name, 'filterType'))
  class GetManyInputFilterType {
    static {
      for (const { name, drizzleField } of model.fields) {
        const fieldType = mapDrizzleToGraphQLType(drizzleField.dataType);
        Field(() => mapGraphQLTypeToFilterType(fieldType), {
          nullable: true,
        })(GetManyInputFilterType.prototype, name);
      }
    }

    @Field(() => [GetManyInputFilterType], { nullable: true })
    and?: GetManyInputFilterType[];

    @Field(() => [GetManyInputFilterType], { nullable: true })
    or?: GetManyInputFilterType[];

    @Field(() => GetManyInputFilterType, { nullable: true })
    not?: GetManyInputFilterType;
  }

  @InputType(toCamelCase(model.name, 'getManyInputType'))
  class GetManyInputType {
    @Field(() => Int, { nullable: true })
    offset?: number;

    @Field(() => Int, { nullable: true })
    limit?: number;

    @Field(() => GetManyInputFilterType, { nullable: true })
    filter?: any;

    @Field(() => [String], { nullable: true })
    orderBy?: any;
  }

  return GetManyInputType;
}

export function generateRelationFilters(
  model: Model,
  sourceRelation: RelationRepresentation,
) {
  const relationFieldName = sourceRelation.foreignField.name;
  // input types
  @InputType(toCamelCase(model.name, sourceRelation.modelName, 'filterType'))
  class RelationFilterInputType {
    static {
      for (const { name, drizzleField } of model.fields) {
        // ignore local relation field
        if (name === relationFieldName) continue;

        const fieldType = mapDrizzleToGraphQLType(drizzleField.dataType);
        Field(() => mapGraphQLTypeToFilterType(fieldType), {
          nullable: true,
        })(RelationFilterInputType.prototype, name);
      }
    }

    @Field(() => [RelationFilterInputType], { nullable: true })
    and?: RelationFilterInputType[];

    @Field(() => [RelationFilterInputType], { nullable: true })
    or?: RelationFilterInputType[];

    @Field(() => RelationFilterInputType, { nullable: true })
    not?: RelationFilterInputType;
  }

  @InputType(
    toCamelCase(model.name, sourceRelation.modelName, 'getManyInputType'),
  )
  class GetManyInputType {
    @Field(() => Int, { nullable: true })
    limit?: number;

    @Field(() => RelationFilterInputType, { nullable: true })
    filter?: any;

    @Field(() => [String], { nullable: true })
    orderBy?: any;
  }

  return GetManyInputType;
}
