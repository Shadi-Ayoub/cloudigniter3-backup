import type { CiDevTenantResolutionCheckup } from "@cloudigniter/core/types";

// let cachedTenantResolutionCheckup: CiDevTenantResolutionCheckup | null = null;

let tenantResolutionCheckupPromise: Promise<CiDevTenantResolutionCheckup> | null = null;

export function ciGetTenantResolutionCheckup(): Promise<CiDevTenantResolutionCheckup> {
  if (tenantResolutionCheckupPromise) {
    return tenantResolutionCheckupPromise;
  }

  tenantResolutionCheckupPromise = fetch("/ci-internal/dev-beacon/tenant-resolution-checkup", {
    method: "GET",
    headers: {
      accept: "application/json",
    },
    cache: "no-store",
  })
    .then(async (response) => {
      const responseText = await response.text();

      if (!response.ok) {
        let responseDetails = responseText;

        try {
          const payload = JSON.parse(responseText) as {
            error?: string;
            message?: string;
          };

          responseDetails = payload.message ?? payload.error ?? responseText;
        } catch {
          // Retain the raw response.
        }

        throw new Error(
          [`Tenant resolution checkup failed with HTTP ${response.status}.`, responseDetails].filter(Boolean).join(" "),
        );
      }

      const contentType = response.headers.get("content-type");

      if (!contentType?.includes("application/json")) {
        throw new Error(`Tenant resolution checkup returned ` + `"${contentType ?? "unknown"}" instead of JSON.`);
      }

      try {
        return JSON.parse(responseText) as CiDevTenantResolutionCheckup;
      } catch {
        throw new Error("Tenant resolution checkup returned invalid JSON.");
      }
    })
    .finally(() => {
      tenantResolutionCheckupPromise = null;
    });

  return tenantResolutionCheckupPromise;
}

// export function ciGetTenantResolutionCheckup(): Promise<CiDevTenantResolutionCheckup> {
//   if (cachedTenantResolutionCheckup) {
//     return Promise.resolve(cachedTenantResolutionCheckup);
//   }

//   if (tenantResolutionCheckupPromise) {
//     return tenantResolutionCheckupPromise;
//   }

//   tenantResolutionCheckupPromise = fetch("/ci-internal/dev-beacon/tenant-resolution-checkup", {
//     method: "GET",
//     headers: {
//       accept: "application/json",
//     },
//     cache: "no-store",
//   })
//     .then(async (response) => {
//       const responseText = await response.text();

//       if (!response.ok) {
//         let responseDetails = responseText;

//         try {
//           const payload = JSON.parse(responseText) as {
//             error?: string;
//             message?: string;
//           };

//           responseDetails = payload.message ?? payload.error ?? responseText;
//         } catch {
//           // The response was not JSON; retain the raw response.
//         }

//         throw new Error(
//           [`Tenant resolution checkup failed with HTTP ${response.status}.`, responseDetails].filter(Boolean).join(" "),
//         );
//       }

//       const contentType = response.headers.get("content-type");

//       if (!contentType?.includes("application/json")) {
//         throw new Error(`Tenant resolution checkup returned ` + `"${contentType ?? "unknown"}" instead of JSON.`);
//       }

//       try {
//         return JSON.parse(responseText) as CiDevTenantResolutionCheckup;
//       } catch {
//         throw new Error("Tenant resolution checkup returned invalid JSON.");
//       }
//     })
//     .then((result) => {
//       cachedTenantResolutionCheckup = result;
//       return result;
//     })
//     .finally(() => {
//       tenantResolutionCheckupPromise = null;
//     });

//   return tenantResolutionCheckupPromise;
// }

// export function ciClearTenantResolutionCheckupCache(): void {
//   cachedTenantResolutionCheckup = null;
// }
