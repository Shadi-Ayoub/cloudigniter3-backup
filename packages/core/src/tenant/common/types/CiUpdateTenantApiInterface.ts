import type { CiAuthMode, CiUpdateTenantInterface } from "../../../";

export interface CiUpdateTenantApiInterface extends CiUpdateTenantInterface {
  authMode: CiAuthMode;
}
