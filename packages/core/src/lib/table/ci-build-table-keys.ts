import type { CiBuildTableKeysInput, CiTableKeys } from "../../types/table-types";
import { ciBuildTableKey } from "./ci-build-table-key";

/** Builds the canonical `PK` and `SK` pair for a CloudIgniter table item. */
export function ciBuildTableKeys(input: CiBuildTableKeysInput): CiTableKeys {
  return {
    PK: ciBuildTableKey(...input.partition),
    SK: ciBuildTableKey(...input.sort),
  };
}
