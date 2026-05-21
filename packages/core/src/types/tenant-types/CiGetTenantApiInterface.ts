import type { CiGetTenantInterface } from "./CiGetTenantInterface";
import type { CiAuthMode } from "@/types";

export interface CiGetTenantApiInterface extends CiGetTenantInterface {
  authMode: CiAuthMode;
}
