export const SYSTEM_TABLE_HANDLERS = [
  "ciCleanupSeededTenantsHandler",
  "ciDeleteTenantHandler",
  "ciListTenantsHandler",
  "ciPurgeTenantHandler",
  "ciRestoreTenantHandler",
  "ciSeedTenantsHandler",
  "ciSetTenantStatusHandler",
  "ciCreateOrgUnitHandler",
  "ciGetOrgUnitByPathHandler",
  "ciListOrgUnitsHandler",
  "ciUpdateOrgUnitHandler",
] as const;

export type CiSystemTableHandlers = (typeof SYSTEM_TABLE_HANDLERS)[number];
