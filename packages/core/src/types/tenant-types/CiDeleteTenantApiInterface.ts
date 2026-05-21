import type { CiDeleteTenantInterface } from "./CiDeleteTenantInterface";
import type { CiAuthMode } from "@/types";

export interface CiDeleteTenantApiInterface extends CiDeleteTenantInterface {
  authMode: CiAuthMode;
}
