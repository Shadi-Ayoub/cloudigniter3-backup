import type { CiDeleteTenantInterface } from "./CiDeleteTenantInterface";
import type { CiAuthMode } from "@ci-core/types";

export interface CiDeleteTenantApiInterface extends CiDeleteTenantInterface {
  authMode: CiAuthMode;
}
