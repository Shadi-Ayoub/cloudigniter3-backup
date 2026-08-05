"use client";

import type { CiNextContext } from "@ci-next/types";
import { CiDevBeaconCard, CiDevBeaconCardRowSeparator } from "@ci-next/modules/dev/dev-beacon/client/components";
import {
  CiDevBeaconAuthenticatedUserSegment,
  CiDevBeaconProvidersStatusSegment,
  CiDevBeaconPlatformInformationSegment,
  CiDevBeaconResolutionCheckupSegment,
} from "./components";

export interface CiGeneralStatusCardProps {
  context: CiNextContext;
}

export function CiDevBeaconGeneralDiagnisticsCard({ context }: CiGeneralStatusCardProps) {
  const currentUser = context.auth?.user;

  return (
    <CiDevBeaconCard
      title="General Diagnostics"
      description="Platform, provider, authentication, and request-resolution status."
      tooltip={
        <>
          Shows the resolved application platform, configured providers, current authentication state, and tenant and
          organizational-unit resolution diagnostics. Select a resolution result to inspect its detailed report.
        </>
      }
      tooltipAriaLabel="About general details and diagnostics"
      maxHeight="32rem"
    >
      <CiDevBeaconPlatformInformationSegment config={context.config.appCoreConfig.app!} />

      <CiDevBeaconCardRowSeparator />

      <CiDevBeaconProvidersStatusSegment context={context} />

      <CiDevBeaconCardRowSeparator />

      <CiDevBeaconAuthenticatedUserSegment currentUser={currentUser} />

      <CiDevBeaconCardRowSeparator />

      <CiDevBeaconResolutionCheckupSegment />
    </CiDevBeaconCard>
  );
}
