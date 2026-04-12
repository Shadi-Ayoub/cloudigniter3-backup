export const SYSTEM_TABLE_HANDLERS = [
  'ciClearSeederHandler',
  'ciCreateTenantHandler',
  'ciDeleteTenantHandler',
  'ciGetTenantHandler',
  'ciGetTenantBySlugHandler',
  'ciGetTenantLookupBySlugHandler',
  'ciListTenantsHandler',
  'ciSeedTenantsHandler',
  'ciUpdateTenantHandler',
] as const;

export type CiSystemTableHandlers = (typeof SYSTEM_TABLE_HANDLERS)[number];
