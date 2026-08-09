/** Identifies the system-only authorization scope outside tenant data. */
export type CiSystemAccessScope = {
  kind: "system";
};

/** Identifies the cross-tenant authorization scope. */
export type CiGlobalAccessScope = {
  kind: "global";
};

/** Identifies one tenant authorization scope. */
export type CiTenantAccessScope = {
  kind: "tenant";
  tenantId: string;
};

/** Identifies one Org Unit authorization scope within a tenant. */
export type CiOrgUnitAccessScope = {
  kind: "orgUnit";
  tenantId: string;
  orgUnitId: string;

  /** Ancestors ordered from the root toward the direct parent. */
  ancestorOrgUnitIds?: readonly string[];
};

/** Concrete resource scope supplied to an authorization request or grant. */
export type CiAccessScope =
  | CiSystemAccessScope
  | CiGlobalAccessScope
  | CiTenantAccessScope
  | CiOrgUnitAccessScope;
