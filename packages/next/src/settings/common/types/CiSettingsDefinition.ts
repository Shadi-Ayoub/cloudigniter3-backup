import type { CiSettings } from './CiSettings';
import type { CiSettingsDefinitionMeta } from './CiSettingsDefinitionMeta';
import type { CiSettingsSchema } from './CiSettingsSchema';
import type { CiSettingsScope } from './CiSettingsScope';

/**
 * Registry definition for a settings domain.
 */
export type CiSettingsDefinition<TSettings extends CiSettings = CiSettings> = {
  scope: CiSettingsScope;
  defaults?: TSettings;
  schema?: CiSettingsSchema<TSettings>;
  mergeWithCore?: boolean;
  allowClientRead?: boolean;
  allowClientWrite?: boolean;
  meta?: CiSettingsDefinitionMeta;
};
