import type { CiGetTenantInterface } from "./CiGetTenantInterface";
import type { CiAuthMode } from "../../../";

export interface CiGetTenantApiInterface extends CiGetTenantInterface {
  authMode: CiAuthMode;
}
