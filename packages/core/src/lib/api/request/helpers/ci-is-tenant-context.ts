import type { CiTenantContext } from "@ci-core/types";
import { ciIsOptionalString } from "./ci-is-optional-string";
import { ciIsRecord } from "./ci-is-record";

export function ciIsTenantContext(value: unknown): value is CiTenantContext {
  if (!ciIsRecord(value)) {
    return false;
  }

  return (
    typeof value.exists === "boolean" &&
    (value.scope === "system" || value.scope === "global" || value.scope === "tenant") &&
    ciIsOptionalString(value.id) &&
    ciIsOptionalString(value.slug) &&
    ciIsOptionalString(value.name) &&
    ciIsOptionalString(value.status) &&
    ciIsOptionalString(value.mode) &&
    ciIsOptionalString(value.source)
  );
}
