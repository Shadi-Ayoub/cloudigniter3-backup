import type { CiOrgUnitContext } from "@ci-core/types";
import { ciIsOptionalString } from "./ci-is-optional-string";
import { ciIsRecord } from "./ci-is-record";

export function ciIsOrgUnitContext(value: unknown): value is CiOrgUnitContext {
  if (!ciIsRecord(value)) {
    return false;
  }

  return (
    typeof value.path === "string" &&
    ciIsOptionalString(value.id) &&
    ciIsOptionalString(value.tenantId) &&
    ciIsOptionalString(value.slug) &&
    ciIsOptionalString(value.name) &&
    ciIsOptionalString(value.status) &&
    (value.parentId === undefined || value.parentId === null || typeof value.parentId === "string") &&
    (value.exists === undefined || typeof value.exists === "boolean")
  );
}
