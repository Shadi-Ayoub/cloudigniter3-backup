import type { CiSettingsDefinition } from './CiSettingsDefinition';

/**
 * Settings registry keyed by settings identifier.
 */
export type CiSettingsRegistry = Record<string, CiSettingsDefinition>;
