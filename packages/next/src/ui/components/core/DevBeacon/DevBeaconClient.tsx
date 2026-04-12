// DevBeaconClient.tsx (CLIENT COMPONENT)
'use client';

import * as React from 'react';

import type { BeaconPosition, BeaconTabValue, CiEnvMode, Direction } from '@CI/types';

import { DevBeaconButton } from './DevBeaconButton';
import { DevBeaconModal } from './DevBeaconModal';
import { DevBeaconSideTabsList, type DevBeaconExtraTab } from './DevBeaconSideTabsList';
import { DevBeaconSectionStatus } from './DevBeaconSectionStatus';
import { DevBeaconSectionConfig } from './DevBeaconSectionConfig';
import { DevBeaconSectionTools } from './DevBeaconSectionTools';
import type { DevBeaconTenantInfo } from './types';

export interface DevBeaconClientProps {
  dir?: Direction;
  position?: BeaconPosition;
  env?: CiEnvMode;
  logo?: React.ReactNode;
  defaultTab?: BeaconTabValue | string;

  isContentLoaded?: boolean;
  onRequestMarkLoaded?: (fn: (loaded: boolean) => void) => void;

  extraTabs?: DevBeaconExtraTab[];
  viewportTopOffset?: string;
  viewportBottomOffset?: string;

  tenant?: DevBeaconTenantInfo;
}

export function DevBeaconClient({
  dir = 'ltr',
  position = 'bottom-right',
  env = 'prod',
  logo,
  defaultTab = 'status',
  isContentLoaded,
  onRequestMarkLoaded,
  extraTabs = [],
  viewportTopOffset,
  viewportBottomOffset,
  tenant,
}: DevBeaconClientProps) {
  const [open, setOpen] = React.useState(false);
  const [loaded, setLoaded] = React.useState<boolean>(!!isContentLoaded);

  React.useEffect(() => {
    if (onRequestMarkLoaded) onRequestMarkLoaded(setLoaded);
  }, [onRequestMarkLoaded]);

  React.useEffect(() => {
    if (typeof isContentLoaded === 'boolean') setLoaded(isContentLoaded);
  }, [isContentLoaded]);

  return (
    <>
      {!open && (
        <DevBeaconButton
          loaded={loaded}
          onClick={() => setOpen(true)}
          env={env}
          position={position}
          size='md'
          logo={logo}
        />
      )}

      <DevBeaconModal
        open={open}
        onOpenChange={setOpen}
        env={env}
        loaded={loaded}
        defaultTab={defaultTab}
        dir={dir}
        SideTabsList={DevBeaconSideTabsList}
        SectionStatus={() => <DevBeaconSectionStatus tenant={tenant} />}
        SectionConfig={DevBeaconSectionConfig}
        SectionTools={(props) => <DevBeaconSectionTools {...props} onMarkLoaded={() => setLoaded(true)} />}
        extraTabs={extraTabs}
        viewportTopOffset={viewportTopOffset}
        viewportBottomOffset={viewportBottomOffset}
      />
    </>
  );
}
