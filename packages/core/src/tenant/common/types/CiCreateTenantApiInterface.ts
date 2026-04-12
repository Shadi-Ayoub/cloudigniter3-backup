import type { CiCreateTenantInterface } from "./CiCreateTenantInterface";
import type { CiAuthMode } from "../../../";

export interface CiCreateTenantApiInterface extends CiCreateTenantInterface {
  authMode: CiAuthMode;
}
