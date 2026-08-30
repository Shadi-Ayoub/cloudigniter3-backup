import type { CiSeederManifest } from "@cloudigniter/core/types";

/** Application-owned development seeder catalog. */
export const appSeederManifest = {
  version: 1,
  seeders: [
    {
      id: "test-tenants",
      title: "Test Tenants",
      description:
        "Creates a disposable multi-company group, central headquarters, and shared Org Unit tree.",
      resource: "platform.tenants",
      dataDirectory: "data/tenants",
      dataFiles: ["tenants.json"],
      createApi: "SeedTenants",
      cleanupApi: "CleanupSeededTenants",
    },
  ],
} as const satisfies CiSeederManifest;

export const testTenantsSeeder = appSeederManifest.seeders[0];
