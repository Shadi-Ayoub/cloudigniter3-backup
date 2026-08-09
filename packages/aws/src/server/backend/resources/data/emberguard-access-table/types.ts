import type { CiEmberguardAccessTableHandlers } from "./handlers";

export type { CiEmberguardAccessTableHandlers };

export type CiEmberguardAccessTable = {
  emberguardAccess: {
    name: string;
    arn: string;
  };
};
