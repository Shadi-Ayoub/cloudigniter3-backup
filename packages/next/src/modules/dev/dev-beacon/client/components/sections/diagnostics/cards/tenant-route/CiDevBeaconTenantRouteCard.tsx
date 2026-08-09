"use client";

import type { CiNextContext } from "@ci-next/types";
import { CiDevBeaconCard, CiDevBeaconCardRowSeparator } from "@ci-next/modules/dev/dev-beacon/client/components";
import {
  CiDevBeaconOrgUnitContextSegment,
  CiDevBeaconRouteContextSegment,
  CiDevBeaconTenantContextSegment,
} from "./components";

interface CiTenantRouteCardProps {
  context: CiNextContext;
}

const EMPTY_VALUE = "—";

export function CiDevBeaconTenantRouteCard({ context }: CiTenantRouteCardProps) {
  const tenant = context.tenant;
  const orgUnit = context.orgUnit;
  const featurePathname = context.featurePathname?.trim() || EMPTY_VALUE;

  return (
    <CiDevBeaconCard
      title="Tenant & Route Context"
      description="Tenant, organizational-unit, and feature-route values resolved for the current request."
      tooltip={
        <>
          Shows how the current request was resolved to a tenant, organizational unit, and application feature route.
          These values are resolved by the CloudIgniter proxy and forwarded through the request context.
        </>
      }
      tooltipAriaLabel="About tenant and route context"
      maxHeight="32rem"
    >
      <CiDevBeaconRouteContextSegment
        route={context.route}
        featurePathname={context.featurePathname}
        routesDefinitions={context.config.appCoreConfig.routes}
      />

      <CiDevBeaconCardRowSeparator />

      <CiDevBeaconTenantContextSegment tenant={tenant} />

      <CiDevBeaconCardRowSeparator />

      <CiDevBeaconOrgUnitContextSegment orgUnit={orgUnit} featurePathname={featurePathname} />
    </CiDevBeaconCard>
  );
}
