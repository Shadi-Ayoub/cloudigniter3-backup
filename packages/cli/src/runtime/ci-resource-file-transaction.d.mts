import type {
  CiCreateResourceFileTransactionInput,
  CiResourceFileApplyResult,
  CiResourceFileConflict,
  CiResourceFileRollbackResult,
  CiResourceFileTransactionJournal,
  CiResourceFileTransactionReference,
} from "../types/resource-file-transaction-types.mjs";

export class CiResourceFileTransactionError extends Error {
  readonly code: string;
  readonly conflicts: CiResourceFileConflict[];

  constructor(
    message: string,
    options?: {
      cause?: unknown;
      code?: string;
      conflicts?: CiResourceFileConflict[];
    },
  );
}

export function ciCreateResourceFileTransaction(
  input: CiCreateResourceFileTransactionInput,
): Promise<CiResourceFileTransactionJournal>;

export function ciApplyResourceFileTransaction(
  input: CiResourceFileTransactionReference,
): Promise<CiResourceFileApplyResult>;

export function ciRunResourceFileTransaction(
  input: CiCreateResourceFileTransactionInput,
): Promise<CiResourceFileApplyResult>;

export function ciRollbackResourceFileTransaction(
  input: CiResourceFileTransactionReference,
): Promise<CiResourceFileRollbackResult>;

export function ciReadResourceFileTransaction(
  input: CiResourceFileTransactionReference,
): Promise<CiResourceFileTransactionJournal>;
