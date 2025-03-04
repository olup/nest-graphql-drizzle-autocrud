import { Args, Field, Info, ObjectType, Query } from "@nestjs/graphql";
import { count } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { Model } from "../types/model.types";
import { Wrapper } from "../types/wrapper.type";
import { PageInfo } from "../utils/generics";
import { transformInfoToQueryObject } from "../utils/graphql.utils";
import { infoNodeToWithRelation } from "../utils/query.utils";
import { toCamelCase } from "../utils/string.utils";
import { queryFilterToDrizzleFilter } from "../utils/type-mapping.utils";
import { PgTable } from "drizzle-orm/pg-core";

export function getManyGenerator(
  target: any,
  model: Model,
  objectType: any,
  GetManyInputType: any,
  db: PostgresJsDatabase,
  wrappers: Record<string, Wrapper>
) {
  const queryName = toCamelCase(model.name, "getMany");

  // response type
  @ObjectType(toCamelCase(model.name, "getManyOutputType"))
  class GetManyOutputType {
    @Field(() => [objectType], { nullable: false })
    nodes!: any[];

    @Field(() => PageInfo, { nullable: true })
    pageInfo!: PageInfo;
  }

  // resolver
  target.prototype[queryName] = async function (input?: any, info?: any) {
    const infoJson = transformInfoToQueryObject(info);
    const query = Object.values(infoJson)[0];

    const queryMap = query.$fields?.nodes
      ? infoNodeToWithRelation(query.$fields?.nodes, model)
      : undefined;

    const getManyMutation = async (input?: any) => {
      try {
        // @ts-expect-error TODO we need to fix typing here
        const results = await db.query[model.name].findMany({
          where: (table: PgTable) =>
            input?.filter && queryFilterToDrizzleFilter(input.filter, table),
          with: queryMap?.with,
          limit: input?.limit,
          offset: input?.offset,
        });

        const totalCount = await db
          .select({ count: count() })
          .from(model.drizzleTable)
          .where(
            (table) =>
              input?.filter &&
              queryFilterToDrizzleFilter(input.filter, table as any)
          );

        return {
          nodes: results,
          pageInfo: {
            offset: input?.offset || 0,
            limit: input?.limit,
            total: totalCount[0].count,
          },
        };
      } catch (e) {
        console.error(e);
      }
    };

    if (wrappers.getMany) {
      return wrappers.getMany(getManyMutation, input);
    }
    return getManyMutation(input);
  };

  // decorators
  Reflect.defineMetadata(
    "design:paramtypes",
    [GetManyInputType],
    target.prototype,
    queryName
  );

  Args("input", { type: () => GetManyInputType, nullable: true })(
    target.prototype,
    queryName,
    0
  );

  Info()(target.prototype, queryName, 1);

  Query(() => GetManyOutputType, { name: queryName })(
    target.prototype,
    queryName,
    Object.getOwnPropertyDescriptor(target.prototype, queryName)!
  );
}
