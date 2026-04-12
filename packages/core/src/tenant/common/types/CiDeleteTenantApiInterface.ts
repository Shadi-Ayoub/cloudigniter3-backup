import type { CiDeleteTenantInterface } from "./CiDeleteTenantInterface";
import type { CiAuthMode } from "../../../";

export interface CiDeleteTenantApiInterface extends CiDeleteTenantInterface {
  authMode: CiAuthMode;
}
