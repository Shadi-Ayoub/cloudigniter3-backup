import type { CiDevTenantResolutionCheckup } from "@cloudigniter/core/types";

export async function ciGetTenantResolutionCheckup(): Promise<CiDevTenantResolutionCheckup> {
  let cachedTenantResolutionCheckup: CiDevTenantResolutionCheckup | null = null;
  let tenantResolutionCheckupPromise: Promise<CiDevTenantResolutionCheckup> | null =
    null;

  if (cachedTenantResolutionCheckup) {
    return cachedTenantResolutionCheckup;
  }

  if (tenantResolutionCheckupPromise) {
    return tenantResolutionCheckupPromise;
  }

  tenantResolutionCheckupPromise = fetch(
    "/ci-internal/dev-beacon/tenant-resolution-checkup",
    {
      method: "GET",
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
    },
  )
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(
          `Tenant resolution checkup failed with HTTP ${response.status}.`,
        );
      }

      return (await response.json()) as CiDevTenantResolutionCheckup;
    })
    .then((result) => {
      cachedTenantResolutionCheckup = result;

      return result;
    })
    .catch((error) => {
      tenantResolutionCheckupPromise = null;

      throw error;
    });

  return tenantResolutionCheckupPromise;
}
