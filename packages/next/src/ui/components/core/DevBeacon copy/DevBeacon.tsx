'use client';

import * as React from 'react';

import type { BeaconPosition, BeaconTabValue, DevEnv, Direction } from '@CI/types';

import { DevBeaconButton } from './DevBeaconButton';
import { DevBeaconModal } from './DevBeaconModal';
import { SideTabsList } from './SideTabsList';
import { SectionStatus } from './SectionStatus';
import { SectionConfig } from './SectionConfig';
import { SectionTools } from './SectionTools';

export interface DevBeaconProps {
  /** Page direction; tabs list is placed accordingly. */
  dir?: Direction;
  /** Where to pin the beacon button. */
  position?: BeaconPosition;
  /** Show only when env matches this; default 'development'. Pass null to always show. */
  visibleWhenEnv?: DevEnv | null;
  /** Current env (defaults to process.env.NODE_ENV) */
  env?: DevEnv;
  /** Optional: your CloudIgniter logo (16–24px recommended). */
  logo?: React.ReactNode;
  /** Optional: initial tab value. */
  defaultTab?: BeaconTabValue;
  /** Optional: externally control “content loaded” state. */
  isContentLoaded?: boolean;
  /** Callback you can call from inside dashboard to mark loaded. */
  onRequestMarkLoaded?: (fn: (loaded: boolean) => void) => void;
}

export function DevBeacon({
  dir = 'ltr',
  position = 'bottom-right',
  visibleWhenEnv = 'development',
  env = (process.env.NODE_ENV as DevEnv) ?? 'production',
  logo,
  defaultTab = 'status',
  isContentLoaded,
  onRequestMarkLoaded,
}: DevBeaconProps) {
  const [open, setOpen] = React.useState(false);
  const [loaded, setLoaded] = React.useState<boolean>(!!isContentLoaded);

  // Expose the setter to parent (optional)
  React.useEffect(() => {
    if (onRequestMarkLoaded) onRequestMarkLoaded(setLoaded);
  }, [onRequestMarkLoaded]);

  // Keep in sync if parent controls it
  React.useEffect(() => {
    if (typeof isContentLoaded === 'boolean') setLoaded(isContentLoaded);
  }, [isContentLoaded]);

  // Env visibility
  const isVisible = visibleWhenEnv === null || String(visibleWhenEnv).toLowerCase() === String(env).toLowerCase();

  if (!isVisible) return null;

  return (
    <>
      {/* Floating Circle Button — hides when modal open */}
      {!open && (
        <DevBeaconButton
          loaded={loaded}
          onClick={() => setOpen(true)}
          env={env} // 'development' | 'staging' | 'production'
          position={position}
          size='md' // 'sm' | 'md' | 'lg'
          logo={logo} // optional custom logo node
        />
      )}

      {/* Modal */}
      <DevBeaconModal
        open={open}
        onOpenChange={setOpen}
        env={env}
        loaded={loaded}
        defaultTab={defaultTab}
        dir={dir}
        SideTabsList={SideTabsList}
        SectionStatus={SectionStatus}
        SectionConfig={SectionConfig}
        SectionTools={(props) => <SectionTools {...props} onMarkLoaded={() => setLoaded(true)} />}
      />
    </>
  );
}
