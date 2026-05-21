import type { CiCreateTenantInterface } from "./CiCreateTenantInterface";
import type { CiAuthMode } from "@/types";

export interface CiCreateTenantApiInterface extends CiCreateTenantInterface {
  authMode: CiAuthMode;
}
