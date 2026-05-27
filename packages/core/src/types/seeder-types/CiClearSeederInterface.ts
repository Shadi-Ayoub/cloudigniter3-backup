import type { CiSeedEnvMode } from "@ci-core/types";

export interface CiClearSeederInterface {
  item: string;
  seedSetId: string;
  envMode: CiSeedEnvMode;
}
