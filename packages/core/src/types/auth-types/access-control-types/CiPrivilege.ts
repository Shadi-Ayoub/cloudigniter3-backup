import type { CiAccessScopeKind } from "./CiAccessScopeKind";
import type { CiPrivilegeEffect } from "./CiPrivilegeEffect";

/**
 * Declares an allowed or denied action on resources.
 *
 * Resource and action values may contain segment wildcards. For example,
 * `identity.*` with action `read` targets registered resources below the
 * identity domain, while action `*` targets every registered action.
 */
export type CiPrivilege = {
  /** Stable identifier used for storage, administration, and audit output. */
  id: string;
  /** Human-readable label used in forms, catalogs, and audit displays. */
  title: string;
  effect: CiPrivilegeEffect;
  resource: string;
  action: string;
  scopeKinds: readonly CiAccessScopeKind[];
  description?: string;
};
