import type { CiTenantDdbTableItem, CiTenantStatus } from "./";

/**
 * High-level CiTenant type used across CloudIgniter.
 */
export type CiTenant = {
  /**
   * Internal ID (same as tenantId and the suffix in SK)
   */
  id: string;

  /**
   * Alias for id if you prefer explicit naming.
   */
  tenantId: string;

  status: CiTenantStatus;

  name: string;
  description?: string;

  /**
   * Human-friendly slug (URL, labels, etc.)
   */
  slug: string;

  /**
   * Arbitrary tenant metadata (config, tags, etc.)
   */
  meta?: Record<string, unknown>;

  createdAt?: string;
  updatedAt?: string;

  raw?: CiTenantDdbTableItem;
};
