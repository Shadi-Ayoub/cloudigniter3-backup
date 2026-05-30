import { headers } from "next/headers";
import { CI_DEFAULT_TENANT_ID_HEADER_NAME } from "@cloudigniter/core/lib";

export async function ciGetTenantId(
  headerName: string = CI_DEFAULT_TENANT_ID_HEADER_NAME,
): Promise<string> {
  const h = await headers();

  const tenantId = h.get(headerName) ?? null;

  if (!tenantId) {
    // We may decide to throw or fallback
    throw new Error(
      "[CloudIgniter] CiTenantId header not found. Ensure middleware sets x-ci-tenant-id.",
    );
  }

  return tenantId;
}
