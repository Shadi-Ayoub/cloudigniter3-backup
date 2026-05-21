import type { CiSeedEnvMode } from "@/types";

export interface CiClearSeederInterface {
  item: string;
  seedSetId: string;
  envMode: CiSeedEnvMode;
}
