import type { CiGetTenantBySlugInterface } from "./CiGetTenantBySlugInterface";
import type { CiAuthMode } from "../../../";

export interface CiGetTenantBySlugApiInterface
  extends CiGetTenantBySlugInterface {
  authMode: CiAuthMode;
}
