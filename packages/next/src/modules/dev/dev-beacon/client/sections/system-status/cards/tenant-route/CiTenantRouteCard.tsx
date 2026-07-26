"use client";

import type { CiNextContext } from "@ci-next/types";

import { CiDevBeaconStatusCard, CiDevBeaconStatusRow } from "../../components";

interface CiDevBeaconTenantRouteCardProps {
  context: CiNextContext;
}

const EMPTY_VALUE = "—";

export function CiDevBeaconTenantRouteCard({ context }: CiDevBeaconTenantRouteCardProps) {
  const tenant = context.tenant;

  const hasDistinctTenantSlug = Boolean(tenant?.slug) && tenant?.slug !== tenant?.id;

  const hasDistinctTenantId = Boolean(tenant?.id) && tenant?.id !== tenant?.slug;

  const tenantName = tenant?.name?.trim() || EMPTY_VALUE;
  const tenantScope = tenant?.scope || EMPTY_VALUE;
  const tenantMode = tenant?.mode || EMPTY_VALUE;
  const tenantStatus = tenant?.status || EMPTY_VALUE;
  const tenantSlug = tenant?.slug?.trim() || EMPTY_VALUE;
  const tenantId = tenant?.id?.trim() || EMPTY_VALUE;

  const orgUnitPath = context.orgUnit?.path?.trim() || EMPTY_VALUE;

  const featurePathname = context.featurePathname?.trim() || EMPTY_VALUE;

  return (
    <CiDevBeaconStatusCard title="Tenant & Route Context">
      <CiDevBeaconStatusRow label="Tenant" value={tenantName} mono={tenantName === EMPTY_VALUE} />

      <CiDevBeaconStatusRow label="Scope" value={tenantScope} mono={tenantScope === EMPTY_VALUE} />

      <CiDevBeaconStatusRow label="Mode" value={tenantMode} mono={tenantMode === EMPTY_VALUE} />

      <CiDevBeaconStatusRow label="Status" value={tenantStatus} mono={tenantStatus === EMPTY_VALUE} />

      <CiDevBeaconStatusRow
        label="Route Slug"
        value={tenantSlug}
        mono={tenantSlug === EMPTY_VALUE}
        valueClassName={hasDistinctTenantSlug ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" : ""}
      />

      <CiDevBeaconStatusRow
        label="Tenant ID"
        value={tenantId}
        mono={tenantId === EMPTY_VALUE}
        valueClassName={hasDistinctTenantId ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" : ""}
      />

      <div className="my-3 border-t" />

      <CiDevBeaconStatusRow label="Org Unit" value={orgUnitPath} mono allowWrap />

      <CiDevBeaconStatusRow label="Feature Route" value={featurePathname} mono allowWrap />

      <p className="text-muted-foreground mt-3 text-xs leading-5">
        Resolved by Proxy and available in the current request context.
      </p>
    </CiDevBeaconStatusCard>
  );
}
