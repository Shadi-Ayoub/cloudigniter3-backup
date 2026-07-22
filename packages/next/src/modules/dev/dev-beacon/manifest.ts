import type { CiModuleManifest } from "@cloudigniter/core/types";

export const ciModuleManifest = {
  schemaVersion: 1,
  id: "cloudigniter.dev.beacon",
  name: "Devbeacon",
  description: "The CloudIgniter's Devbeacon component.",
  enabledByDefault: true,

  runtime: {
    client: true,
    server: true,
  },

  target: {
    framework: "next",
    clouds: ["aws"],
  },

  dependencies: [
    {
      id: "cloudigniter.i18n",
      environments: ["client", "server"],
    },
    {
      id: "cloudigniter.theme",
      environments: ["client"],
    },
  ],

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
