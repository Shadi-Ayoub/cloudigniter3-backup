import type { CiRequestContext } from "@ci-core/types";
import { ciIsOrgUnitContext } from "./ci-is-org-unit-context";
import { ciIsRoute } from "./ci-is-route";
import { ciIsTenantContext } from "./ci-is-tenant-context";
import { ciIsRecord } from "./ci-is-record";

export function ciIsRequestContext(value: unknown): value is CiRequestContext {
  if (!ciIsRecord(value)) {
    return false;
  }

  return (
    value.schemaVersion === 1 &&
    ciIsTenantContext(value.tenant) &&
    (value.orgUnit === null || ciIsOrgUnitContext(value.orgUnit)) &&
    (value.featurePathname === null || typeof value.featurePathname === "string") &&
    (value.route === null || ciIsRoute(value.route))
  );
}
