import type { CiSettings } from '../../common/types/CiSettings';

/**
 * Result returned by the `useSettings` hook.
 */
export type CiUseSettingsResult<TSettings extends CiSettings = CiSettings> = {
  data: TSettings | undefined;
  isLoading: boolean;
  error?: string;
  refresh: () => Promise<void>;
};
