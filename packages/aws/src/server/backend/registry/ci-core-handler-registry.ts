import type { CiCoreFunctionId } from '../types';

export type CiCoreHandlerRegistryEntry = {
  /**
   * Stable function identifier used across the backend core.
   */
  id: CiCoreFunctionId;

  /**
   * Optional human-readable label for diagnostics.
   */
  label?: string;

  /**
   * Optional grouping for tooling/debugging.
   */
  group?: string;

  /**
   * Whether the handler should be enabled by default.
   */
  enabled?: boolean;
};

export const ciCoreHandlerRegistry: readonly CiCoreHandlerRegistryEntry[] = [
  {
    id: 'ciCreateCognitoUserHandler',
    label: 'Create Cognito User Handler',
    group: 'auth',
  },
  {
    id: 'ciGetCognitoUserHandler',
    label: 'Get Cognito User Handler',
    group: 'auth',
  },
  {
    id: 'ciGetSettingsHandler',
    label: 'Get Settings Handler',
    group: 'settings',
  },
  {
    id: 'ciSetSettingsHandler',
    label: 'Set Settings Handler',
    group: 'settings',
  },
  {
    id: 'ciClearSeederHandler',
    label: 'Clear Seeds Handler',
    group: 'seeder',
  },
  {
    id: 'ciCreateTenantHandler',
    label: 'Create CiTenant Handler',
    group: 'tenant',
  },
  {
    id: 'ciDeleteTenantHandler',
    label: 'Delete CiTenant Handler',
    group: 'tenant',
  },
  {
    id: 'ciGetTenantHandler',
    label: 'Get CiTenant Handler',
    group: 'tenant',
  },
  {
    id: 'ciGetTenantBySlugHandler',
    label: 'Get CiTenant By Slug Handler',
    group: 'tenant',
  },
  {
    id: 'ciListTenantsHandler',
    label: 'List Tenants Handler',
    group: 'tenant',
  },
  {
    id: 'ciSeedTenantsHandler',
    label: 'Seed Tenants Handler',
    group: 'tenant',
  },
  {
    id: 'ciUpdateTenantHandler',
    label: 'Update CiTenant Handler',
    group: 'tenant',
  },
] as const;

export function ciGetEnabledCoreHandlerIds(): CiCoreFunctionId[] {
  return ciCoreHandlerRegistry.filter((entry) => entry.enabled !== false).map((entry) => entry.id);
}
