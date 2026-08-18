import { ENTRY_KIND } from "@cloudigniter/cli/tooling/entries";

export const ciEntriesConfig = {
  barrels: [
    {
      kind: "client",
      barrel: "src/client/index.ts",
      outPrefix: "client",
      srcRoot: "src/client",
      preserveStructure: true,
    },
    {
      kind: "other",
      barrel: "src/server/index.ts",
      outPrefix: "server",
      srcRoot: "src/server",
      preserveStructure: false,
    },
    {
      kind: "other",
      barrel: "src/server/backend/index.ts",
      outPrefix: "server/backend",
      srcRoot: "src/server/backend",
      preserveStructure: false,
    },
    {
      kind: "other",
      barrel: "src/lib/index.ts",
      outPrefix: "lib",
      srcRoot: "src/lib",
      preserveStructure: true,
    },
  ],

  structuredSourceRoots: [],

  staticEntryPaths: [
    { kind: ENTRY_KIND.CLIENT, path: "src/client/index.ts" },
    { kind: ENTRY_KIND.OTHER, path: "src/server/index.ts" },
    { kind: ENTRY_KIND.OTHER, path: "src/server/backend/index.ts" },
    { kind: ENTRY_KIND.OTHER, path: "src/lib/index.ts" },
  ],
};
