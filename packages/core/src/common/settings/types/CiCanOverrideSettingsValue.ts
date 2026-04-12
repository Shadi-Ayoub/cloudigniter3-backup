import type { CiCanOverrideSettingsValueInput } from './CiCanOverrideSettingsValueInput';

/**
 * Override policy callback.
 */
export type CiCanOverrideSettingsValue = (
  input: CiCanOverrideSettingsValueInput,
) => boolean | Promise<boolean>;
