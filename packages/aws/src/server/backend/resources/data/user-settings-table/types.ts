import { type CiUserSettingsTableHandlers } from './handlers';

export type { CiUserSettingsTableHandlers };

export type CiUserSettingsTable = {
  userSettings: {
    name: string;
    arn: string;
  };
};
