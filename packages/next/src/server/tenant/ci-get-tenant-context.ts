import { headers } from "next/headers";
import { CI_DEFAULT_TENANT_HEADERS } from "@cloudigniter/core/lib";
import type {
  CiTenantContext,
  CiTenantRoutingMode,
  CiTenantScope,
} from "@cloudigniter/core/types";

/**
 * Read tenant context resolved by middleware.
 * This function MUST stay dumb: it does not parse host/URL and does not do lookups.
 */
export async function ciGetTenantContext(): Promise<CiTenantContext> {
  const h = await headers();

  const tenantId = h.get(CI_DEFAULT_TENANT_HEADERS.tenantId) ?? "";
  const tenantSlug = h.get(CI_DEFAULT_TENANT_HEADERS.tenantId) ?? undefined;
  const tenantScope = (h.get(CI_DEFAULT_TENANT_HEADERS.tenantScope) ??
    "unknown") as CiTenantScope;
  const tenantMode = (h.get(CI_DEFAULT_TENANT_HEADERS.tenantMode) ??
    "unknown") as CiTenantRoutingMode;

  if (!tenantId && tenantScope != "system") {
    // Fail fast: middleware is responsible for resolving tenant.
    throw new Error(
      `[ciGetTenantContext()] Missing "${CI_DEFAULT_TENANT_HEADERS.tenantId}" header. Ensure middleware sets it before reaching server components.`,
    );
  }

  return { tenantId, tenantSlug, tenantScope, tenantMode };
}
