import type { SeedItemDef } from '@CI/types';

export const SEED_ITEMS: SeedItemDef[] = [
  { key: 'users', label: 'Seed Users', description: 'Create mock users + profiles', mockBaseName: 'users' },
  { key: 'tenants', label: 'Seed Tenants', description: 'Create mock tenants', mockBaseName: 'tenants' },
  { key: 'orgUnits', label: 'Seed Org Units', description: 'Create org unit hierarchy', mockBaseName: 'orgUnits' },
];
