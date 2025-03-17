import { Int } from "@nestjs/graphql";
import {
  BooleanFilter,
  DateTimeFilter,
  FloatFilter,
  IntFilter,
  StringFilter,
} from "./generics";
import {
  and,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNull,
  lt,
  lte,
  not,
  or,
  SQL,
} from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { DrizzleType, FilterFunction, GraphQLType } from "../types/model.types";

/**
 * Maps Drizzle types to GraphQL types
 */
export function mapDrizzleToGraphQLType(drizzleType: DrizzleType): GraphQLType {
  const typeMap: Record<DrizzleType, GraphQLType> = {
    integer: Int,
    text: String,
    timestamp: String,
    number: Int,
    serial: Int,
    boolean: Boolean,
    string: String,
    bigint: Int,
    json: String,
  };
  const type = typeMap[drizzleType];

  if (!type) {
    console.warn(`Unknown type: ${drizzleType}`);
    return String;
  }
  return type;
}

/**
 * Maps GraphQL types to corresponding filter types
 */
export function mapGraphQLTypeToFilterType(type: GraphQLType) {
  const typeMap: Record<string, any> = {
    Int: IntFilter,
    String: StringFilter,
    Float: FloatFilter,
    Date: DateTimeFilter,
    Boolean: BooleanFilter,
  };
  // @ts-expect-error test
  return typeMap[type] || StringFilter;
}

const filterMap: Record<string, FilterFunction> = {
  equals: eq,
  not,
  in: inArray,
  lt,
  lte,
  gt,
  gte,
  and,
  or,
  isNull: (column, value) => (value ? isNull(column) : not(isNull(column))),
  includes: (column, value) => ilike(column, `%${String(value)}%`),
};

export function mapFilterToDrizzleFilter(filter: string): FilterFunction {
  const drizzleFilter = filterMap[filter];
  if (!drizzleFilter) {
    throw new Error(`Unsupported filter operation: ${filter}`);
  }
  return drizzleFilter;
}

export const queryFilterToDrizzleFilter = (
  queryFilter: Record<string, any>,
  fields: PgTable
): SQL | undefined => {
  if (!queryFilter || Object.keys(queryFilter).length === 0) {
    return undefined;
  }

  const conditions = Object.entries(queryFilter)
    .map(([key, value]): SQL | undefined => {
      if (value === undefined) return undefined;

      switch (key) {
        case "and":
          return and(
            ...(value as any[])
              .map((f) => queryFilterToDrizzleFilter(f, fields))
              .filter(Boolean)
          );
        case "or":
          return or(
            ...(value as any[])
              .map((f) => queryFilterToDrizzleFilter(f, fields))
              .filter(Boolean)
          );
        case "not":
          const operation = queryFilterToDrizzleFilter(value, fields);
          if (!operation) return undefined;
          return not(operation);
        default:
          // @ts-expect-error we know that key is a string
          if (!fields[key]) {
            console.log(fields);
            throw new Error(`Unknown field: ${key}`);
          }
          return and(
            ...Object.entries(value)
              .map(([filterKey, filterValue]): SQL | undefined => {
                if (filterValue === undefined) return undefined;
                const filterFunction = mapFilterToDrizzleFilter(filterKey);
                // @ts-expect-error we know that key is a string
                return filterFunction(fields[key], filterValue);
              })
              .filter(Boolean)
          );
      }
    })
    .filter(Boolean);

  return conditions.length > 0 ? and(...conditions) : undefined;
};
