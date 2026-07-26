import type { CiRouteSearchParams } from "@ci-core/types";
import { ciIsRecord } from "./ci-is-record";

export function ciIsRouteSearchParams(value: unknown): value is CiRouteSearchParams {
  if (!ciIsRecord(value)) {
    return false;
  }

  return Object.values(value).every(
    (entry) => typeof entry === "string" || (Array.isArray(entry) && entry.every((item) => typeof item === "string")),
  );
}
