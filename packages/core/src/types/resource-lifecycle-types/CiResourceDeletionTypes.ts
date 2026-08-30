/** Stable lifecycle states shared by resources that support reversible deletion. */
export type CiResourceDeletionState = "active" | "deleted";

/** Trusted audit metadata stored when a resource is moved to Trash. */
export type CiResourceDeletionMetadata = {
  state: "deleted";
  operationId: string;
  deletedAt: string;
  deletedBy: string;
  reason: string;
};

/** Input accepted by a privileged soft-delete operation. */
export type CiSoftDeleteResourceInput = {
  resourceId: string;
  reason: string;
};

/** Input accepted by a privileged restore operation. */
export type CiRestoreResourceInput = {
  resourceId: string;
  reason: string;
};

/**
 * Input accepted by an irreversible purge operation.
 *
 * `confirmation` must exactly match `resourceId`; trusted server logic remains
 * responsible for authorization and for verifying the resource is already in
 * Trash.
 */
export type CiPurgeResourceInput = {
  resourceId: string;
  reason: string;
  confirmation: string;
};

/** Standard mutation result returned by resource lifecycle actions. */
export type CiResourceLifecycleMutationResult<TResource = unknown> =
  | { ok: true; message: string; resource?: TResource }
  | { ok: false; message: string };
