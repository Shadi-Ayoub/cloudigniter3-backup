import type { CiSeederItemKey } from './CiSeederItemKey';

export type CiSeedItemDef = {
  key: CiSeederItemKey;
  label: string;
  description?: string;
  // optional: used to map mock filename patterns, etc.
  mockBaseName?: string; // e.g. "users" -> "users-mock.json"
};
