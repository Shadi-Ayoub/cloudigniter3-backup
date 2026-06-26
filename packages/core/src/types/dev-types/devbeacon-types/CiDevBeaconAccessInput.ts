import type { CiEnvMode } from "@ci-core/types";
import type { CiDevBeaconOptions } from "./CiDevBeaconOptions";
import type { CiDevBeaconActor } from "./CiDevBeaconActor";

export type CiDevBeaconAccessInput = {
  options?: CiDevBeaconOptions;
  envMode: CiEnvMode;
  actor: CiDevBeaconActor;
};
