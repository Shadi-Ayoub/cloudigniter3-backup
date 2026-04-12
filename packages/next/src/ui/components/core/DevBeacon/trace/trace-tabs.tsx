// trace-tabs.tsx  (NO 'use client')
import * as React from 'react';
import { ListTree } from 'lucide-react';

import type { DevBeaconExtraTab } from '../DevBeaconSideTabsList';
import { DevBeaconTraceLogViewerText } from './DevBeaconTraceLogViewerText';
import type { DevBeaconTraceLogViewerTextProps } from './DevBeaconTraceLogViewerText';

/**
 * Server-safe builder: it only returns plain objects + React elements.
 * It does NOT execute client hooks; it just references a client component.
 */
export function devBeaconGetTraceLogTextTab(overrides?: DevBeaconTraceLogViewerTextProps): DevBeaconExtraTab {
  return {
    id: 'trace',
    label: 'Trace',
    icon: ListTree,
    content: <DevBeaconTraceLogViewerText {...overrides} />,
  };
}
