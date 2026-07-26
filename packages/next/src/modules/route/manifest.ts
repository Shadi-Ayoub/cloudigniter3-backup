import type { CiModuleManifest } from "@cloudigniter/core/types";

export const ciModuleManifest = {
  schemaVersion: 1,
  id: "cloudigniter.route",
  name: "User",
  description: "Provides route management.",
  enabledByDefault: true,

  runtime: {
    client: true,
    server: true,
  },

  target: {
    framework: "next",
    clouds: [],
  },

  dependencies: [],

  packageDependencies: [],
} as const satisfies CiModuleManifest;
