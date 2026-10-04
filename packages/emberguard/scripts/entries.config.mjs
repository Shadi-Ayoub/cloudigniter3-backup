import { ENTRY_KIND } from "@cloudigniter/dev/tooling/entries";

export const ciEntriesConfig = {
  staticEntryPaths: [
    { kind: ENTRY_KIND.OTHER, path: "src/index.ts" },
    { kind: ENTRY_KIND.CLIENT, path: "src/client/index.ts" },
    { kind: ENTRY_KIND.OTHER, path: "src/server/index.ts" },
    { kind: ENTRY_KIND.OTHER, path: "src/lib/index.ts" },
    { kind: ENTRY_KIND.OTHER, path: "src/providers/aws/index.ts" },
  ],
};
