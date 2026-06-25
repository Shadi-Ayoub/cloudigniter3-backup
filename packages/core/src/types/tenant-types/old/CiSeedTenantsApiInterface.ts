import type { CiSeedTenantsInterface } from "./CiSeedTenantsInterface";
import type { CiAuthMode } from "@ci-core/types";

export interface CiSeedTenantsApiInterface extends CiSeedTenantsInterface {
  authMode?: CiAuthMode;
}
