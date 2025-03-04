import { PgTable } from "drizzle-orm/pg-core";
import { Model } from "../types/model.types";
import { QueryObject } from "./graphql.utils";
import { queryFilterToDrizzleFilter } from "./type-mapping.utils";

function isObject(variable: any) {
  return (
    variable !== null &&
    typeof variable === "object" &&
    !Array.isArray(variable)
  );
}

export const infoNodeToWithRelation = (
  node: QueryObject["$fields"],
  model: Model
) => {
  const input = node.$args?.input;

  const relationFields =
    node.$fields &&
    Object.entries(node.$fields)
      .filter(([, value]) => value && isObject(value) && !!value.$fields)
      .map(([name, field]) => ({ name, field }));

  const limit = input?.limit;

  const where = (table: PgTable) =>
    input?.filter && queryFilterToDrizzleFilter(input.filter, table);

  const $with = relationFields?.reduce(
    (acc, { name, field }) => {
      acc[name] = infoNodeToWithRelation(
        field,
        model.relations.find((r) => r.relationFieldName === name)?.foreignModel!
      );
      return acc;
    },
    {} as Record<string, any>
  );

  return {
    limit,
    where,
    with: $with,
  };
};
