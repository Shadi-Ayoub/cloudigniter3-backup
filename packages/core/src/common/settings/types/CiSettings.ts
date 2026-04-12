import type { CiSettingsValue } from './CiSettingsValue';

/**
 * Generic settings object shape.
 */
export type CiSettings = {
  [key: string]: CiSettingsValue;
};
