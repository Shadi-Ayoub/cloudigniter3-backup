import type { CiAccessScopeKind } from "./CiAccessScopeKind";
import type { CiActionDefinition } from "./CiActionDefinition";

/** Runtime availability of one authorization resource. */
export type CiResourceStatus = "active" | "suspended";

/** Audit metadata retained for the latest resource status transition. */
export type CiResourceStatusChange = {
  changedAt: string;
  changedBy: string;
  reason: string;
};

/** Canonical application resource and the actions and scopes it supports. */
export type CiResourceDefinition = {
  id: string;
  domainId: string;
  title: string;
  description?: string;
  status?: CiResourceStatus;
  statusChange?: CiResourceStatusChange;
  actions: readonly CiActionDefinition[];
  scopeKinds: readonly CiAccessScopeKind[];
};
