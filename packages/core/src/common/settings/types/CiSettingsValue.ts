/**
 * Recursive JSON-like value used across the settings domain.
 */
export type CiSettingsValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | CiSettingsValue[]
  | { [key: string]: CiSettingsValue };
