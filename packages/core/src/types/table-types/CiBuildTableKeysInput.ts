import type { CiTableKeySegments } from "./CiTableKeySegments";

/** Segment collections for a table item's primary partition and sort keys. */
export type CiBuildTableKeysInput = {
  partition: CiTableKeySegments;
  sort: CiTableKeySegments;
};
