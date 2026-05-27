import type { ResourcesConfig } from 'aws-amplify';

type CustomAmplifyOutputs = {
  custom?: {
    lambda?: {
      getSettingsHandlerName?: string;
    };
    [key: string]: any; // 👈 allows extension without type errors
  };
};

export type CiAmplifyOutputs = ResourcesConfig & CustomAmplifyOutputs;
