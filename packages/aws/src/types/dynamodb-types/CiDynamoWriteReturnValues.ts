/**
 * ReturnValues supported by write helpers.
 *
 * Notes:
 * - PutItem supports only "NONE" and "ALL_OLD"
 * - UpdateItem supports the full set below
 */
export type CiDynamoWriteReturnValues =
  | "NONE"
  | "ALL_OLD"
  | "ALL_NEW"
  | "UPDATED_NEW"
  | "UPDATED_OLD";
