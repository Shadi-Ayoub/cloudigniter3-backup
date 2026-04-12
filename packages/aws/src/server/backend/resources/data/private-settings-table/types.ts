import { type CiPrivateSettingsTableHandlers } from './handlers';

export type { CiPrivateSettingsTableHandlers };

export type CiPrivateSettingsTable = {
  privateSettings: {
    name: string;
    arn: string;
  };
};
