import type { CiModuleManifest } from "@cloudigniter/core/types";

export const ciModuleManifest = {
  schemaVersion: 1,
  id: "cloudigniter.auth",
  name: "Auth",
  description:
    "Provides authentication, session management, and authorization (access control management).",
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
