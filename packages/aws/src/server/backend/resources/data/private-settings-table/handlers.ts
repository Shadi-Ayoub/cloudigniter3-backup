export const PRIVATE_SETTINGS_TABLE_HANDLERS = ['ciGetSettingsHandler', 'ciSetSettingsHandler'] as const;

export type CiPrivateSettingsTableHandlers = (typeof PRIVATE_SETTINGS_TABLE_HANDLERS)[number];
