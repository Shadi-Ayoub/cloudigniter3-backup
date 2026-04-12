import type { CiCoreResources } from '../resources/resource-types';

export type CiCoreRuntime = {
  resources: CiCoreResources;
  region: string;
  envMode: string;
};
