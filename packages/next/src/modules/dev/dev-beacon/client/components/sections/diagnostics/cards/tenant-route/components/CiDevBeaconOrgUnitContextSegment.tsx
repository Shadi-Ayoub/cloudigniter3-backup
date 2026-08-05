import type { CiOrgUnitContext } from "@cloudigniter/core/types";

import { CiDevBeaconCardRow, CiDevBeaconCardRowGrid } from "@ci-next/modules/dev/dev-beacon/client/components";

interface CiDevBeaconOrgUnitContextSegmentProps {
  orgUnit: CiOrgUnitContext | null;
  featurePathname: string | null;
}

const EMPTY_VALUE = "—";

export function CiDevBeaconOrgUnitContextSegment({ orgUnit, featurePathname }: CiDevBeaconOrgUnitContextSegmentProps) {
  const orgUnitPath = orgUnit?.path?.trim() || EMPTY_VALUE;
  const pathname = featurePathname || EMPTY_VALUE;

  return (
    <CiDevBeaconCardRowGrid title="Org Unit Information" columns={2} boxed={true} cellPadding="compact">
      <CiDevBeaconCardRow
        label="Org Unit"
        value={orgUnitPath}
        mono
        allowWrap
        tooltip="The resolved organizational-unit path within the current tenant."
      />

      <CiDevBeaconCardRow
        label="Feature Route"
        value={pathname}
        mono
        allowWrap
        tooltip="The application feature pathname remaining after tenant and organizational-unit routing segments are resolved."
      />
    </CiDevBeaconCardRowGrid>
  );
}
