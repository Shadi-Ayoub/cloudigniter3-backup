import { type CiPublicSettingsTableHandlers } from './handlers';

export type { CiPublicSettingsTableHandlers };

export type CiPublicSettingsTable = {
  publicSettings: {
    name: string;
    arn: string;
  };
};
