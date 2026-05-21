import type { CiAuthMode, CiUpdateTenantInterface } from "@/types";

export interface CiUpdateTenantApiInterface extends CiUpdateTenantInterface {
  authMode: CiAuthMode;
}
