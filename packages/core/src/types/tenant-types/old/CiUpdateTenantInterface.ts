export interface CiUpdateTenantInterface {
  tenantId: string;
  name?: string;
  description?: string;
  slug?: string;
  meta?: Record<string, unknown>;
}
