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
  /**
   * Forces read-only access on matching resources and scopes, regardless of
   * other grants or precedence. The write restriction ignores this statement's
   * action pattern; read access still requires a matching allow statement.
   */
  readOnly?: boolean;
  description?: string;
};
