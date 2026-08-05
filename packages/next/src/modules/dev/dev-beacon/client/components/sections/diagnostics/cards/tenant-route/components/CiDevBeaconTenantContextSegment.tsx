import type { CiTenantContext } from "@cloudigniter/core/types";

import { CiDevBeaconCardRow, CiDevBeaconCardRowGrid } from "@ci-next/modules/dev/dev-beacon/client/components";

interface CiDevBeaconTenantContextSegmentProps {
  tenant: CiTenantContext | null;
}

const EMPTY_VALUE = "—";

export function CiDevBeaconTenantContextSegment({ tenant }: CiDevBeaconTenantContextSegmentProps) {
  const tenantName = tenant?.name?.trim() || EMPTY_VALUE;
  const tenantScope = tenant?.scope || EMPTY_VALUE;
  const tenantMode = tenant?.mode || EMPTY_VALUE;
  const tenantStatus = tenant?.status || EMPTY_VALUE;
  const tenantSlug = tenant?.slug?.trim() || EMPTY_VALUE;
  const tenantId = tenant?.id?.trim() || EMPTY_VALUE;

  const hasDistinctTenantSlug = tenantSlug !== EMPTY_VALUE && tenantId !== EMPTY_VALUE && tenantSlug !== tenantId;
  const hasDistinctTenantId = tenantId !== EMPTY_VALUE && tenantSlug !== EMPTY_VALUE && tenantId !== tenantSlug;

  return (
    <CiDevBeaconCardRowGrid title="Tenant Information" columns={2} boxed={true} cellPadding="compact">
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
  );
}
