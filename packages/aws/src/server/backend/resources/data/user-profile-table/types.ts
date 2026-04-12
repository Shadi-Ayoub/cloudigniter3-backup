import { type CiUserProfileTableHandlers } from './handlers';

export type { CiUserProfileTableHandlers };

export type CiUserProfileTable = {
  userProfile: {
    name: string;
    arn: string;
  };
};
