import { ENTRY_KIND } from "../../../scripts/build-steps/ci-entries.mjs";

/** Defines the public and recursively expanded UI package build entries. */
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
      preserveStructure: true,
    },
  ],

  structuredSourceRoots: [],

  staticEntryPaths: [
    { kind: ENTRY_KIND.CLIENT, path: "src/index.ts" },
    { kind: ENTRY_KIND.CLIENT, path: "src/client/index.ts" },
    { kind: ENTRY_KIND.OTHER, path: "src/server/index.ts" },
    { kind: ENTRY_KIND.OTHER, path: "src/lib/index.ts" },
  ],
};
