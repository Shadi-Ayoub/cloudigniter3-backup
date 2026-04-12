import type { CiSettingsScope } from './CiSettingsScope';

/**
 * Persistence-supported scopes.
 */
export type CiScopedSettingsScope = Exclude<CiSettingsScope, 'route'>;
