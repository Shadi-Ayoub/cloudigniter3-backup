import type { CiGetTenantLookupBySlugInterface } from "./CiGetTenantLookupBySlugInterface";
import type { CiAuthMode } from "@/types";

export interface CiGetTenantLookupBySlugApiInterface
  extends CiGetTenantLookupBySlugInterface {
  authMode: CiAuthMode;
}
