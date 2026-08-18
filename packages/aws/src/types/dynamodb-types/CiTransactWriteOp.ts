import type { CiDynamoExistenceMode } from "./CiDynamoExistenceMode";

/**
 * Generic DynamoDB key shape.
 */
export type CiDynamoKey = Record<string, any>;

/**
 * Generic DynamoDB item shape.
 */
export type CiDynamoItem = Record<string, any>;

/**
 * PUT operation inside a transaction.
 */
export type CiTransactWritePutOp = {
  mode: "put";

  /**
   * Primary key.
   */
  key: CiDynamoKey;

  /**
   * Full item (merged with key).
   */
  item: CiDynamoItem;

  /**
   * Existence constraint.
   * - "insertOnly" ensures item does not exist
   */
  existence?: Extract<CiDynamoExistenceMode, "any" | "insertOnly">;

  /** Optional provider-owned invariant condition for the put. */
  condition?: {
    expression: string;
    names?: Record<string, string>;
    values?: Record<string, any>;
  };
};

/**
 * UPDATE operation inside a transaction.
 */
export type CiTransactWriteUpdateOp = {
  mode: "update";

  /**
   * Primary key.
   */
  key: CiDynamoKey;

  /**
   * Update specification.
   * (Keep aligned with your writeItem update contract)
   */
  update: {
    set?: Record<string, any>;
    // future:
    // remove?: string[]
    // add?: Record<string, number>
  };

  /**
   * Existence constraint.
   * - "updateOnly" ensures item exists
   */
  existence?: Extract<CiDynamoExistenceMode, "any" | "updateOnly">;
};

/**
 * DELETE operation inside a transaction.
 */
export type CiTransactWriteDeleteOp = {
  mode: "delete";

  /**
   * Primary key.
   */
  key: CiDynamoKey;

  /**
   * Existence constraint.
   * - "deleteOnly" ensures item exists
   */
  existence?: Extract<CiDynamoExistenceMode, "any" | "deleteOnly">;
};

/**
 * Union of all transaction write operations.
 *
 * Design:
 * - Discriminated union using `mode`
 * - Enforces correct shape per operation
 */
export type CiTransactWriteOp =
  | CiTransactWritePutOp
  | CiTransactWriteUpdateOp
  | CiTransactWriteDeleteOp;
