/**
 * Shared existence constraint used across DynamoDB mutation helpers.
 */
export type CiDynamoExistenceMode =
  | "any"
  | "insertOnly"
  | "updateOnly"
  | "deleteOnly";
