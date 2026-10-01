export type { CiImportPackageEntryInput } from "../runtime/ci-import-package-entry.mjs";

export type CiValidateModulesInput = {
  workspaceRoot: string;
  kind?: "core" | "user";
  /** Absolute or workspace-relative module directory. */
  root?: string;
};

export type {
  CiCreateResourceFileTransactionInput,
  CiResourceFileAbsentState,
  CiResourceFileApplyResult,
  CiResourceFileChange,
  CiResourceFileConflict,
  CiResourceFileDelete,
  CiResourceFilePresentState,
  CiResourceFileRollbackResult,
  CiResourceFileState,
  CiResourceFileTransactionEntry,
  CiResourceFileTransactionJournal,
  CiResourceFileTransactionReference,
  CiResourceFileTransactionStatus,
  CiResourceFileWrite,
} from "./resource-file-transaction-types.mjs";
