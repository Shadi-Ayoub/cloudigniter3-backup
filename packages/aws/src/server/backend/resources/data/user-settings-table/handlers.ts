export const USER_SETTINGS_TABLE_HANDLERS = ['ciGetSettingsHandler', 'ciSetSettingsHandler'] as const;

export type CiUserSettingsTableHandlers = (typeof USER_SETTINGS_TABLE_HANDLERS)[number];
