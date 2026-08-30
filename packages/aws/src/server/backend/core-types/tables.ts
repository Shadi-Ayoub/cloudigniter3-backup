import type { CiCoreFunctionId } from "./functions";

export const CI_CORE_TABLE_KEYS = [
  "emberguardAccessTable",
  // 'privateSettingsTable',
  // 'publicSettingsTable',
  "systemTable",
  "userProfileTable",
  // 'userSettingsTable',
] as const;

export type CiCoreTableKey = (typeof CI_CORE_TABLE_KEYS)[number];

/**
 * Supported logical table-grant actions used by the DynamoDB grant shim.
 */
export type CiTableGrantAction =
  | "BatchWriteItem"
  | "DeleteItem"
  | "GetItem"
  | "PutItem"
  | "Query"
  | "Read"
  | "Scan"
  | "TransactWriteItems"
  | "UpdateItem"
  | "Write";

/**
 * Legacy table grant abstraction preserved for compatibility with the current
 * DynamoDB-oriented grant shim in `ciApplyCorePostBuildPlan(...)`.
 */
export type CiTableGrantSpec = {
  for: CiCoreFunctionId;
  table: CiCoreTableKey;
  actions: CiTableGrantAction[];
};

export type CiCoreTableInfo = {
  name: string;
  arn: string;
};

export type CiCoreTables = Record<CiCoreTableKey, CiCoreTableInfo>;
