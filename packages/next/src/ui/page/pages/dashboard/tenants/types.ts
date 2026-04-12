import type { CiTenant } from '@CI/types';

// Your tenant shape (adjust to your actual type)
// export type CiTenant = {
//   tenantId: string;
//   name: string;
//   description?: string;
//   slug: string;
//   meta?: Record<string, unknown>;
// };

export type LoadTenantsInput = {
  // optional future filters
  includeDisabled?: boolean;
};

export type LoadTenantsOkBody = {
  items: CiTenant[];
  count: number;
};

export type LoadTenantsErrorBody = { error: unknown; fieldErrors?: unknown } | { error: string; fieldErrors?: unknown };
