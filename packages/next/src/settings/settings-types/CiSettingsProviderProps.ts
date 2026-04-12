import type { PropsWithChildren } from 'react';
import type { CiSettingsClientMap } from './CiSettingsClientMap';

/**
 * Provider props for injecting resolved settings into the client tree.
 */
export type CiSettingsProviderProps = PropsWithChildren<{
  value: CiSettingsClientMap;
}>;
