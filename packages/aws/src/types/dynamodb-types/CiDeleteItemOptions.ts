import type { CiDynamoMetricsOption } from "./CiDynamoMetricsOption";

export interface CiDeleteItemOptions<K extends Record<string, any>> {
  tableName: string;
  key: K;
  existence?: "any" | "deleteOnly";
  returnValues?: "NONE" | "ALL_OLD";
  metrics?: CiDynamoMetricsOption;
}
