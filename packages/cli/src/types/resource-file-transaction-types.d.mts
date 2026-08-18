export type CiResourceFileAbsentState = {
  kind: "absent";
};

export type CiResourceFilePresentState = {
  kind: "file";
  mode: number;
  sha256: string;
  size: number;
};

export type CiResourceFileState =
  CiResourceFileAbsentState | CiResourceFilePresentState;

export type CiResourceFileWrite = {
  path: string;
  content: string | Uint8Array;
  mode?: number;
  delete?: never;
};

export type CiResourceFileDelete = {
  path: string;
  delete: true;
  content?: never;
  mode?: never;
};

export type CiResourceFileChange = CiResourceFileWrite | CiResourceFileDelete;

export type CiResourceFileTransactionStatus =
  | "prepared"
  | "applying"
  | "applied"
  | "rolling-back"
  | "rolled-back"
  | "failed-conflicted"
  | "failed-rolled-back";

export type CiResourceFileTransactionEntry = {
  path: string;
  before: CiResourceFileState;
  after: CiResourceFileState;
};

export type CiResourceFileTransactionJournal = {
  schemaVersion: 1;
  transactionId: string;
  applicationRoot: string;
  status: CiResourceFileTransactionStatus;
  createdAt: string;
  updatedAt: string;
  appliedAt?: string;
  rolledBackAt?: string;
  metadata?: unknown;
  files: CiResourceFileTransactionEntry[];
  plannedCreatedDirectories: string[];
  createdDirectories: string[];
  journalPath: string;
};

export type CiResourceFileConflict = {
  path: string;
  expected: CiResourceFileState;
  actual: CiResourceFileState;
};

export type CiCreateResourceFileTransactionInput = {
  applicationRoot: string;
  changes: CiResourceFileChange[];
  metadata?: unknown;
  transactionId?: string;
};

export type CiResourceFileTransactionReference = {
  applicationRoot: string;
  transactionId: string;
};

export type CiResourceFileApplyResult =
  | {
      status: "applied";
      conflicts: [];
      journal: CiResourceFileTransactionJournal;
    }
  | {
      status: "conflicted";
      conflicts: CiResourceFileConflict[];
      journal: CiResourceFileTransactionJournal;
    };

export type CiResourceFileRollbackResult =
  | {
      status: "rolled-back";
      conflicts: [];
      journal: CiResourceFileTransactionJournal;
    }
  | {
      status: "conflicted";
      conflicts: CiResourceFileConflict[];
      journal: CiResourceFileTransactionJournal;
    };
