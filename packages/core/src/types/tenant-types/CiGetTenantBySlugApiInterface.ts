import type { CiGetTenantBySlugInterface } from "./CiGetTenantBySlugInterface";
import type { CiAuthMode } from "@/types";

export interface CiGetTenantBySlugApiInterface
  extends CiGetTenantBySlugInterface {
  authMode: CiAuthMode;
}
