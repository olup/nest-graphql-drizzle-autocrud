import { Args, Field, Info, InputType, Query } from "@nestjs/graphql";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { Model } from "../types/model.types";
import { Wrapper } from "../types/wrapper.type";
import { infoNodeToWithRelation } from "../utils/query.utils";
import { toCamelCase } from "../utils/string.utils";
import { mapDrizzleToGraphQLType } from "../utils/type-mapping.utils";

export function getOneGenerator(
  target: any,
  model: Model,
  objectType: any,
  db: PostgresJsDatabase,
  wrappers: Record<string, Wrapper>
) {
  const primaryKey = model.primaryKey;
  const queryName = toCamelCase(model.name, "getOne");
  const queryInputTypeName = toCamelCase(queryName, "inputType");

  @InputType(queryInputTypeName)
  class GetOneInputType {
    static _fields: { [key: string]: any } = {};
    static {
      Field(() => mapDrizzleToGraphQLType(primaryKey.type), {
        nullable: false,
      })(GetOneInputType.prototype, primaryKey.name);
    }
  }

  target.prototype[queryName] = async function (input: any, info: any) {
    const queryMap = infoNodeToWithRelation(info.fieldNodes[0], model); // TODO

    const getOneMutation = async (input: any) => {
      // @ts-expect-error TODO we need to fix typing here
      const results = await db.query[model.name].findFirst({
        // @ts-expect-error TODO we need to fix typing here
        where: (t, { eq }) => eq(t[primaryKey.name], input[primaryKey.name]),
        with: queryMap,
      });
      return results;
    };

    if (wrappers.getOne) {
      return wrappers.getOne(getOneMutation, input);
    }
    return getOneMutation(input);
  };

  Reflect.defineMetadata(
    "design:paramtypes",
    [GetOneInputType],
    target.prototype,
    queryName
  );

  Query(() => objectType, { name: queryName })(
    target.prototype,
    queryName,
    Object.getOwnPropertyDescriptor(target.prototype, queryName)!
  );

  Args("input", { type: () => GetOneInputType, nullable: false })(
    target.prototype,
    queryName,
    0
  );

  Info()(target.prototype, queryName, 1);
}
