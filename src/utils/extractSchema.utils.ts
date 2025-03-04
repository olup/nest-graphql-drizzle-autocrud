import {
  createTableRelationsHelpers,
  getTableName,
  is,
  One,
  Relations,
} from "drizzle-orm";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import { Field, Model } from "../types/model.types";

export const extractFields = (table: PgTable): Field[] => {
  return Object.entries(table).map(([key, value]) => ({
    name: key,
    type: value.dataType,
    dbColumnName: value.name,
    drizzleField: value,
  }));
};

export const extractSchemaRepresentation = (
  schema: Record<string, PgTable | Relations>
) => {
  // first extract the models
  const models: Model[] = [];
  for (const [naming, object] of Object.entries(schema)) {
    if (is(object, PgTable)) {
      const fields = extractFields(object);
      const primaryKey = fields.find(
        ({ drizzleField }) => drizzleField.primary
      );
      if (!primaryKey) {
        throw new Error(
          `Table ${getTableConfig(object).name} does not have a primary key - which is needed for graphql auto generation`
        );
      }
      models.push({
        name: naming,
        dbTableName: getTableConfig(object).name,
        fields: extractFields(object),
        relations: [],
        drizzleTable: object,
        primaryKey,
      });
    }
  }

  const relations = Object.values(schema)
    .filter((s) => is(s, Relations))
    .map((r: Relations) => ({
      model: models.find((m) => m.dbTableName === getTableName(r.table)),
      extractedRelation: r.config(createTableRelationsHelpers(r.table)),
    }));

  // now extract relations
  for (const { model, extractedRelation } of relations) {
    if (!model) throw new Error("Model not found");

    for (const [relationFieldName, relation] of Object.entries(
      extractedRelation
    )) {
      if (is(relation, One) && !!relation.config) {
        const foreignModel = models.find(
          (m) => m.dbTableName === getTableName(relation.referencedTable)
        );
        if (!foreignModel) {
          throw new Error(
            `Foreign model not found for relation ${relation.relationName}`
          );
        }

        model.relations.push({
          modelName: model.name,
          foreignModel,
          relationFieldName,
          relationType: "one",
          isNullable: relation.isNullable,
          localField: model.fields.find(
            (f) => f.dbColumnName === relation.config!.fields[0].name
          ),
          foreignField: model.fields.find(
            (f) => f.dbColumnName === relation.config!.references[0].name
          ),
        });
      } else {
        const referenceRelationTable = relations.find(
          (r) => r.model!.dbTableName === getTableName(relation.referencedTable)
        );
        const referenceRelation = Object.values(
          referenceRelationTable!.extractedRelation
        ).find((r) => r.relationName === relation.relationName);

        if (!referenceRelation || is(referenceRelation, One)) continue;

        const foreignModel = models.find(
          (m) => m.dbTableName === getTableName(relation.referencedTable)
        );

        if (!foreignModel) {
          throw new Error(
            `Foreign model not found for relation ${relation.relationName}`
          );
        }

        model.relations.push({
          modelName: model.name,
          foreignModel,
          relationFieldName,
          relationType: is(relation, One) ? "one" : "many",
          isNullable: is(relation, One) ? relation.isNullable : false,

          localField: model.fields.find(
            (f) =>
              // @ts-expect-error TODO need to figure out the typing here
              f.dbColumnName === referenceRelation.config.references[0].name
          ),
          foreignField: foreignModel.fields.find(
            // @ts-expect-error TODO need to figure out the typing here

            (f) => f.dbColumnName === referenceRelation.config.fields[0].name
          ),
        });
      }
    }
  }

  return models;
};
