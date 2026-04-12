import type { CiTenantStatus } from '../';

export type CiTenantHtmlTableRow = {
  /**
   * Stable unique identifier
   */
  tenantId: string;

  /**
   * Human-readable name
   */
  name: string;

  /**
   * URL-safe identifier
   */
  slug: string;

  /**
   * Operational state of the tenant
   */
  status: CiTenantStatus;

  /**
   * Business / organizational classification
   */
  type: 'school' | 'department' | 'organization';

  /**
   * Region or jurisdiction
   */
  region: string;

  usersCount?: number;
  createdAt: string;
  updatedAt?: string;

  /**
   * Flags for system-level tenants
   */
  isSystem?: boolean;
};
