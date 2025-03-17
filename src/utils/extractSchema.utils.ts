import {
  createTableRelationsHelpers,
  getTableName,
  is,
  One,
  Relation,
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
      extractedRelation: r.config(
        createTableRelationsHelpers(r.table)
      ) as Record<string, Relation<string> & { config?: any }>,
    }));

  // now extract relations
  for (const { model, extractedRelation } of relations) {
    if (!model) throw new Error("Model not found");

    for (const [relationFieldName, relation] of Object.entries(
      extractedRelation
    )) {
      if (!relation) throw new Error("Relation not found");

      const relationType = is(relation, One) ? "one" : "many";
      console.log("relation type", relationType);

      const foreignModel = models.find(
        (m) => m.dbTableName === relation.referencedTableName
      );
      if (!foreignModel) {
        throw new Error(
          `Foreign model not found for relation ${relation.relationName}`
        );
      }

      let localField;
      let foreignField;

      // relation can have fields configuration, or needs the correponding relation on the other side

      if (relation.config?.fields && relation.config?.references) {
        console.log("debug : relation has local parameters");

        localField = model.fields.find(
          (f) => f.dbColumnName === relation.config!.fields[0].name
        );
        foreignField = foreignModel.fields.find(
          (f) => f.dbColumnName === relation.config!.references[0].name
        );
      } else {
        // we need to find the corresponding relation on the other side
        // find the opposite relation
        const referenceRelationTable = relations.find(
          (r) => r.model!.dbTableName === getTableName(relation.referencedTable)
        );
        const referenceRelationTableRelations = Object.values(
          referenceRelationTable!.extractedRelation
        );

        let referenceRelationCandidates =
          referenceRelationTableRelations.filter(
            (r) => r.referencedTableName === model.dbTableName
          );

        if (!referenceRelationCandidates?.length) {
          throw new Error(
            `Reference relation not found for relation ${relation.relationName}`
          );
        }

        if (referenceRelationCandidates.length > 1) {
          console.log("debug : multiple reference relations found");
          referenceRelationCandidates = referenceRelationCandidates.filter(
            (r) => r.config.relationName === relation.config.relationName
          );
        }

        const referenceRelation = referenceRelationCandidates[0];

        if (
          referenceRelation?.config?.fields ||
          referenceRelation?.config?.references
        ) {
          console.log("debug : relation has remote parameters");
          localField = model.fields.find(
            (f) =>
              f.dbColumnName === referenceRelation.config!.references[0].name
          );
          foreignField = foreignModel.fields.find(
            (f) => f.dbColumnName === referenceRelation.config!.fields[0].name
          );
        } else {
          console.log("debug : relation has no parameters");
          throw new Error(
            `Reference relation not found for relation ${relation.relationName}`
          );
        }
      }

      model.relations.push({
        modelName: model.name,
        foreignModel,
        relationFieldName,
        relationType: is(relation, One) ? "one" : "many",
        isNullable: is(relation, One) ? relation.isNullable : false,

        localField,
        foreignField,
      });
    }
  }

  return models;
};
