export type CiSeederOperation = "seed" | "cleanup";

export type CiSeederItemStatus =
  | "created"
  | "deleted"
  | "skipped"
  | "failed";

export type CiSeederExecutionItemResult = {
  id: string;
  status: CiSeederItemStatus;
  message?: string;
};

export type CiSeederExecutionResult<TResource = unknown> = {
  ok: boolean;
  seederId: string;
  operation: CiSeederOperation;
  created: number;
  deleted: number;
  skipped: number;
  failed: number;
  items: CiSeederExecutionItemResult[];
  resources?: TResource[];
};
