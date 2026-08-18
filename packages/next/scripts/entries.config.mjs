import { ENTRY_KIND } from "@cloudigniter/cli/tooling/entries";

export const ciEntriesConfig = {
  barrels: [
    {
      kind: ENTRY_KIND.CLIENT,
      barrel: "src/client/index.ts",
      outPrefix: "client",
      srcRoot: "src/client",
      preserveStructure: true,
    },
    {
      kind: ENTRY_KIND.CLIENT,
      barrel: "src/ui/client/index.ts",
      outPrefix: "ui/client",
      srcRoot: "src/ui/client",
      preserveStructure: true,
    },
    {
      kind: ENTRY_KIND.OTHER,
      barrel: "src/server/index.ts",
      outPrefix: "server",
      srcRoot: "src/server",
      preserveStructure: false,
    },
    {
      kind: ENTRY_KIND.OTHER,
      barrel: "src/lib/index.ts",
      outPrefix: "lib",
      srcRoot: "src/lib",
      preserveStructure: false,
    },
  ],

  structuredSourceRoots: [
    {
      kind: ENTRY_KIND.RSC,
      srcRoot: "src/ui/server",
      outPrefix: "ui/server",
    },
    {
      kind: ENTRY_KIND.RSC,
      srcRoot: "src/ui/common",
      outPrefix: "ui/common",
    },
    {
      kind: ENTRY_KIND.RSC,
      srcRoot: "src/layout",
      outPrefix: "layout",
    },
  ],

  staticEntryPaths: [
    { kind: ENTRY_KIND.OTHER, path: "src/server/index.ts" },
    { kind: ENTRY_KIND.OTHER, path: "src/server/proxy/index.ts" },
    { kind: ENTRY_KIND.OTHER, path: "src/lib/index.ts" },
    { kind: ENTRY_KIND.OTHER, path: "src/locales/index.ts" },

    { kind: ENTRY_KIND.CLIENT, path: "src/client/index.ts" },
    { kind: ENTRY_KIND.CLIENT, path: "src/ui/client/index.ts" },

    { kind: ENTRY_KIND.RSC, path: "src/ui/index.ts" },
    { kind: ENTRY_KIND.RSC, path: "src/ui/server/index.ts" },
    { kind: ENTRY_KIND.RSC, path: "src/layout/app-standard/index.ts" },
    { kind: ENTRY_KIND.RSC, path: "src/layout/cp-standard/index.ts" },
    { kind: ENTRY_KIND.RSC, path: "src/layout/login-standard/index.ts" },
  ],
};
