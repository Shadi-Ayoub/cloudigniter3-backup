import type { CiSeedTenantsInterface } from "./CiSeedTenantsInterface";
import type { CiAuthMode } from "@/types";

export interface CiSeedTenantsApiInterface extends CiSeedTenantsInterface {
  authMode?: CiAuthMode;
}
