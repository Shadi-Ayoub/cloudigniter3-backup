import type { CiAuthMode, CiUpdateTenantInterface } from "@ci-core/types";

export interface CiUpdateTenantApiInterface extends CiUpdateTenantInterface {
  authMode: CiAuthMode;
}
