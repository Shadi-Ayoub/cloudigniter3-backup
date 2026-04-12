import type { CiSeedTenantsInterface } from "./CiSeedTenantsInterface";
import type { CiAuthMode } from "../../../";

export interface CiSeedTenantsApiInterface extends CiSeedTenantsInterface {
  authMode?: CiAuthMode;
}
