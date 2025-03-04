import { Args, Parent, ResolveField } from "@nestjs/graphql";
import { Model } from "../types/model.types";
import { SchemaTypes } from "../types/registry.types";
import { generateRelationFilters } from "./types/type.generator";

export const generateRelations = (
  target: any,
  model: Model,
  typeRegistry: SchemaTypes
) => {
  for (const relation of model.relations) {
    if (!typeRegistry[relation.foreignModel.name]) continue;

    const fieldName = relation.relationFieldName;
    const graphqlType = typeRegistry[relation.foreignModel.name].baseType;
    const InputType = generateRelationFilters(relation.foreignModel, relation);

    // just return the parent, as all the fetching is done at once in the root query
    target.prototype[fieldName] = async (parent: any) => {
      return parent[fieldName];
    };

    Reflect.defineMetadata(
      "design:paramtypes",
      [, InputType],
      target.prototype,
      fieldName
    );
    Args("input", { type: () => InputType, nullable: true })(
      target.prototype,
      fieldName,
      1
    );
    Parent()(target.prototype, fieldName, 0);
    ResolveField(
      () => (relation.relationType === "many" ? [graphqlType] : graphqlType),
      {
        nullable:
          relation.relationType === "many" ? false : relation.isNullable,
      }
    )(
      target.prototype,
      fieldName,
      Object.getOwnPropertyDescriptor(target.prototype, fieldName)!
    );
  }
};
