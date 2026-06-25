import type { CiCreateTenantInterface } from "./CiCreateTenantInterface";
import type { CiAuthMode } from "@ci-core/types";

export interface CiCreateTenantApiInterface extends CiCreateTenantInterface {
  authMode: CiAuthMode;
}
