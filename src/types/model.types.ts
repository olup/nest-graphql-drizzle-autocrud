import { Int } from '@nestjs/graphql';
import { SQL } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';

export type DrizzleType =
  | 'integer'
  | 'text'
  | 'timestamp'
  | 'number'
  | 'boolean';
export type GraphQLType = typeof Int | typeof String | typeof Boolean;
export type FilterFunction = (...args: any[]) => SQL;

export type Field = {
  name: string;
  type: DrizzleType;
  dbColumnName: string;
  drizzleField: any;
};
export type RelationRepresentation = {
  modelName: string;
  relationFieldName: string;
  localField?: Field;
  foreignModel: Model;
  foreignField?: Field;
  relationType: 'one' | 'many';
  isNullable: boolean;
};

export type Model = {
  name: string;
  dbTableName: string;
  fields: Field[];
  relations: RelationRepresentation[];
  drizzleTable: PgTable;
  primaryKey: Field;
};
