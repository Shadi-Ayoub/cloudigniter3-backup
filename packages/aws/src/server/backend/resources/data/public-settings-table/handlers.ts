export const PUBLIC_SETTINGS_TABLE_HANDLERS = ['ciGetSettingsHandler', 'ciSetSettingsHandler'] as const;

export type CiPublicSettingsTableHandlers = (typeof PUBLIC_SETTINGS_TABLE_HANDLERS)[number];
