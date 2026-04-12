import type { CiTransactWriteOp } from "./CiTransactWriteOp";

/**
 * Input options for transactWrite helper.
 */
export type CiTransactWriteOptions = {
  tableName: string;
  items: CiTransactWriteOp[];
  returnConsumedCapacity?: "NONE" | "TOTAL" | "INDEXES";
};
