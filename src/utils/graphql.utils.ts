import { GraphQLResolveInfo, FieldNode, ValueNode } from 'graphql';

export type QueryObject = {
  [fieldName: string]: {
    $args?: Record<string, any>; // Optional field arguments
    $fields?: QueryObject; // Recursive definition for nested fields
  };
};

function resolveArgumentValue(
  valueNode: ValueNode,
  variableValues: Record<string, any>,
): any {
  switch (valueNode.kind) {
    case 'Variable': // Resolve variable
      return variableValues[valueNode.name.value];
    case 'ObjectValue': // Resolve nested object
      return valueNode.fields.reduce(
        (acc, field) => {
          acc[field.name.value] = resolveArgumentValue(
            field.value,
            variableValues,
          );
          return acc;
        },
        {} as Record<string, any>,
      );
    case 'ListValue': // Resolve list
      return valueNode.values.map((value) =>
        resolveArgumentValue(value, variableValues),
      );
    case 'IntValue':
    case 'FloatValue':
    case 'StringValue':
    case 'BooleanValue':
    case 'EnumValue':
      return valueNode.value; // Return literal values
    case 'NullValue':
      return null;
    default:
      throw new Error(`Unsupported value kind: ${valueNode.kind}`);
  }
}

function extractQueryStructureWithDollarPrefix(
  fieldNodes: ReadonlyArray<FieldNode>,
  variableValues: Record<string, any>,
): Record<string, any> {
  const result: Record<string, any> = {};

  fieldNodes.forEach((node) => {
    const fieldName = node.name.value;

    // Extract and resolve arguments, including object arguments
    const args = node.arguments?.reduce(
      (acc, arg) => {
        acc[arg.name.value] = resolveArgumentValue(arg.value, variableValues);
        return acc;
      },
      {} as Record<string, any>,
    );

    // Recursively extract sub-fields
    const subFields = node.selectionSet
      ? extractQueryStructureWithDollarPrefix(
          node.selectionSet.selections as FieldNode[],
          variableValues,
        )
      : undefined;

    result[fieldName] = {
      ...(args && { $args: args }), // Include $args only if present
      ...(subFields && { $fields: subFields }), // Include $fields only if present
    };
  });

  return result;
}

export function transformInfoToQueryObject(
  info: GraphQLResolveInfo,
): QueryObject {
  return extractQueryStructureWithDollarPrefix(
    info.fieldNodes,
    info.variableValues,
  );
}
