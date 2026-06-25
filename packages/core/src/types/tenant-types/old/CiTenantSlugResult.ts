export type CiTenantSlugResult =
  | { scope: "tenant"; tenantId: string; featurePathname: string }
  | { scope: "global" };
