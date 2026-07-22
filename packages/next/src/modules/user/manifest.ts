import type { CiModuleManifest } from "@cloudigniter/core/types";

export const ciModuleManifest = {
  schemaVersion: 1,
  id: "cloudigniter.user",
  name: "User",
  description: "Provides user management.",
  enabledByDefault: true,

  runtime: {
    client: true,
    server: true,
  },

  target: {
    framework: "next",
    clouds: ["aws"],
  },

  dependencies: [],

  packageDependencies: [
    {
      name: "@aws-amplify/ui-react",
      specifier: "catalog:",
      sections: ["dependencies"],
    },
    {
      name: "aws-amplify",
      specifier: "catalog:",
      sections: ["dependencies"],
    },
  ],
} as const satisfies CiModuleManifest;
