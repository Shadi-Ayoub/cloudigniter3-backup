"use client";

import type { CiNextContext } from "@ci-next/types";
import { TooltipProvider } from "@cloudigniter/ui/client";

import {
  CiDevBeaconCardRowSeparator,
  CiDevBeaconCardTitle,
  CiDevBeaconCardRow,
  CiDevBeaconCardRowGrid,
} from "@ci-next/modules/dev/dev-beacon/client/components";

interface CiTenantRouteCardProps {
  context: CiNextContext;
}

const EMPTY_VALUE = "—";

export function CiDevBeaconTenantRouteCard({ context }: CiTenantRouteCardProps) {
  const tenant = context.tenant;

  const tenantName = tenant?.name?.trim() || EMPTY_VALUE;
  const tenantScope = tenant?.scope || EMPTY_VALUE;
  const tenantMode = tenant?.mode || EMPTY_VALUE;
  const tenantStatus = tenant?.status || EMPTY_VALUE;
  const tenantSlug = tenant?.slug?.trim() || EMPTY_VALUE;
  const tenantId = tenant?.id?.trim() || EMPTY_VALUE;

  const hasDistinctTenantSlug = tenantSlug !== EMPTY_VALUE && tenantId !== EMPTY_VALUE && tenantSlug !== tenantId;

  const hasDistinctTenantId = tenantId !== EMPTY_VALUE && tenantSlug !== EMPTY_VALUE && tenantId !== tenantSlug;

  const orgUnitPath = context.orgUnit?.path?.trim() || EMPTY_VALUE;

  const featurePathname = context.featurePathname?.trim() || EMPTY_VALUE;

  return (
    <TooltipProvider delayDuration={300} skipDelayDuration={100}>
      <section className="bg-card rounded-lg border p-4 shadow-sm">
        <CiDevBeaconCardTitle
          className="mb-3"
          title="Tenant & Route Context"
          description="Tenant, organizational-unit, and feature-route values resolved for the current request."
          tooltip={
            <>
              Shows how the current request was resolved to a tenant, organizational unit, and application feature
              route. These values are resolved by the CloudIgniter proxy and forwarded through the request context.
            </>
          }
          tooltipAriaLabel="About tenant and route context"
        />

        <div className="space-y-2">
          <CiDevBeaconCardRowGrid title="Tenant Information" columns={2} boxed={true}>
            <CiDevBeaconCardRow
              label="Tenant"
              value={tenantName}
              mono={tenantName === EMPTY_VALUE}
              tooltip="The display name of the tenant resolved for the current request."
            />

            <CiDevBeaconCardRow
              label="Scope"
              value={tenantScope}
              mono={tenantScope === EMPTY_VALUE}
              tooltip="Indicates whether the current request operates within a tenant scope or the shared system scope."
            />

            <CiDevBeaconCardRow
              label="Mode"
              value={tenantMode}
              mono={tenantMode === EMPTY_VALUE}
              tooltip="The routing strategy used to resolve the tenant, such as slug-based or subdomain-based routing."
            />

            <CiDevBeaconCardRow
              label="Status"
              value={tenantStatus}
              mono={tenantStatus === EMPTY_VALUE}
              tooltip="The current operational status of the resolved tenant."
            />

            <CiDevBeaconCardRow
              label="Route Slug"
              value={tenantSlug}
              mono={tenantSlug === EMPTY_VALUE}
              tooltip="The tenant slug extracted from or associated with the current route."
              valueClassName={hasDistinctTenantSlug ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" : ""}
            />

            <CiDevBeaconCardRow
              label="Tenant ID"
              value={tenantId}
              mono={tenantId === EMPTY_VALUE}
              tooltip="The stable identifier assigned to the resolved tenant. It may differ from the route slug."
              valueClassName={hasDistinctTenantId ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" : ""}
            />
          </CiDevBeaconCardRowGrid>

          <CiDevBeaconCardRowSeparator />

          <CiDevBeaconCardRow
            label="Org Unit"
            value={orgUnitPath}
            mono
            allowWrap
            tooltip="The resolved organizational-unit path within the current tenant."
          />

          <CiDevBeaconCardRow
            label="Feature Route"
            value={featurePathname}
            mono
            allowWrap
            tooltip="The application feature pathname remaining after tenant and organizational-unit routing segments are resolved."
          />
        </div>
      </section>
    </TooltipProvider>
  );
}

// "use client";

// import type { CiNextContext } from "@ci-next/types";

// import { CiDevBeaconStatusCard, CiDevBeaconCardRow } from "../../components";

// interface CiDevBeaconTenantRouteCardProps {
//   context: CiNextContext;
// }

// const EMPTY_VALUE = "—";

// export function CiDevBeaconTenantRouteCard({ context }: CiDevBeaconTenantRouteCardProps) {
//   const tenant = context.tenant;

//   const hasDistinctTenantSlug = Boolean(tenant?.slug) && tenant?.slug !== tenant?.id;

//   const hasDistinctTenantId = Boolean(tenant?.id) && tenant?.id !== tenant?.slug;

//   const tenantName = tenant?.name?.trim() || EMPTY_VALUE;
//   const tenantScope = tenant?.scope || EMPTY_VALUE;
//   const tenantMode = tenant?.mode || EMPTY_VALUE;
//   const tenantStatus = tenant?.status || EMPTY_VALUE;
//   const tenantSlug = tenant?.slug?.trim() || EMPTY_VALUE;
//   const tenantId = tenant?.id?.trim() || EMPTY_VALUE;

//   const orgUnitPath = context.orgUnit?.path?.trim() || EMPTY_VALUE;

//   const featurePathname = context.featurePathname?.trim() || EMPTY_VALUE;

//   return (
//     <CiDevBeaconStatusCard title="Tenant & Route Context">
//       <CiDevBeaconCardRow label="Tenant" value={tenantName} mono={tenantName === EMPTY_VALUE} />

//       <CiDevBeaconCardRow label="Scope" value={tenantScope} mono={tenantScope === EMPTY_VALUE} />

//       <CiDevBeaconCardRow label="Mode" value={tenantMode} mono={tenantMode === EMPTY_VALUE} />

//       <CiDevBeaconCardRow label="Status" value={tenantStatus} mono={tenantStatus === EMPTY_VALUE} />

//       <CiDevBeaconCardRow
//         label="Route Slug"
//         value={tenantSlug}
//         mono={tenantSlug === EMPTY_VALUE}
//         valueClassName={hasDistinctTenantSlug ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" : ""}
//       />

//       <CiDevBeaconCardRow
//         label="Tenant ID"
//         value={tenantId}
//         mono={tenantId === EMPTY_VALUE}
//         valueClassName={hasDistinctTenantId ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" : ""}
//       />

//       <div className="my-3 border-t" />

//       <CiDevBeaconCardRow label="Org Unit" value={orgUnitPath} mono allowWrap />

//       <CiDevBeaconCardRow label="Feature Route" value={featurePathname} mono allowWrap />

//       <p className="text-muted-foreground mt-3 text-xs leading-5">
//         Resolved by Proxy and available in the current request context.
//       </p>
//     </CiDevBeaconStatusCard>
//   );
// }
