import type { CiOrgUnitContext, CiTenantContext } from "@ci-core/types";
import type { CiResolvedPathnameContext } from "./CiResolvedPathnameContext";
import type { CiScopeKind } from "./CiScopeKind";

/**
 * Canonical runtime scope context for the current request.
 */
export type CiResolvedScopeContext = {
  /** Effective request scope. */
  scope: CiScopeKind;

  /** Resolved tenant context, if available. */
  tenant: CiTenantContext | null;

  /** Resolved Org Unit context, if available. */
  orgUnit: CiOrgUnitContext | null;

  /** Original, feature, and rewrite pathname values. */
  pathname: CiResolvedPathnameContext;
};
