import { type CiSystemTableHandlers } from './handlers';

export type { CiSystemTableHandlers };

export type CiSystemTable = {
  system: {
    name: string;
    arn: string;
  };
};
