export type CiTenantSlugResult =
  | { scope: 'tenant'; tenantId: string; pathnameWithoutTenant: string }
  | { scope: 'global' };
