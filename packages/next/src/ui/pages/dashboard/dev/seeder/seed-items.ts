import type { CiSeedItemDef } from "@cloudigniter/core/types";

export const SEED_ITEMS: CiSeedItemDef[] = [
  {
    key: "users",
    label: "Seed Users",
    description: "Create mock users + profiles",
    mockBaseName: "users",
  },
  {
    key: "tenants",
    label: "Seed Tenants",
    description: "Create mock tenants",
    mockBaseName: "tenants",
  },
  {
    key: "orgUnits",
    label: "Seed Org Units",
    description: "Create org unit hierarchy",
    mockBaseName: "orgUnits",
  },
];
