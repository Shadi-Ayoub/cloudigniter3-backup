import type {
  CiAccessScope,
  CiGlobalAccessScope,
  CiOrgUnitAccessScope,
  CiScopePropagation,
  CiSystemAccessScope,
  CiTenantAccessScope,
} from "@ci-core/types";

/** Creates the system-only access scope outside tenant data. */
export function ciSystemAccessScope(): CiSystemAccessScope {
  return { kind: "system" };
}

/** Creates the cross-tenant access scope. */
export function ciGlobalAccessScope(): CiGlobalAccessScope {
  return { kind: "global" };
}

/** Creates an access scope for one tenant. */
export function ciTenantAccessScope(tenantId: string): CiTenantAccessScope {
  return {
    kind: "tenant",
    tenantId,
  };
}

/** Creates an access scope for one Org Unit and its known ancestor chain. */
export function ciOrgUnitAccessScope(
  tenantId: string,
  orgUnitId: string,
  ancestorOrgUnitIds: readonly string[] = [],
): CiOrgUnitAccessScope {
  return {
    kind: "orgUnit",
    tenantId,
    orgUnitId,
    ancestorOrgUnitIds,
  };
}

/**
 * Checks whether a grant scope contains a requested scope.
 *
 * Descendant propagation is explicit. A global grant can reach tenants and
 * Org Units without reaching system resources. A tenant grant can only reach
 * Org Units in that tenant, and an Org Unit grant can only reach descendants
 * identified in the request's ancestor chain.
 */
export function ciAccessScopeContains(
  grantScope: CiAccessScope,
  requestedScope: CiAccessScope,
  propagation: CiScopePropagation,
): boolean {
  if (grantScope.kind === "system") {
    return requestedScope.kind === "system";
  }

  if (grantScope.kind === "global") {
    if (requestedScope.kind === "system") {
      return false;
    }

    return requestedScope.kind === "global" || propagation === "descendants";
  }

  if (grantScope.kind === "tenant") {
    if (
      requestedScope.kind === "system" ||
      requestedScope.kind === "global" ||
      requestedScope.tenantId !== grantScope.tenantId
    ) {
      return false;
    }

    return requestedScope.kind === "tenant" || propagation === "descendants";
  }

  if (
    requestedScope.kind !== "orgUnit" ||
    requestedScope.tenantId !== grantScope.tenantId
  ) {
    return false;
  }

  if (requestedScope.orgUnitId === grantScope.orgUnitId) {
    return true;
  }

  return (
    propagation === "descendants" &&
    Boolean(requestedScope.ancestorOrgUnitIds?.includes(grantScope.orgUnitId))
  );
}
