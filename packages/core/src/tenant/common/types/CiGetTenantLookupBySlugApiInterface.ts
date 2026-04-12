import type { CiGetTenantLookupBySlugInterface } from "./CiGetTenantLookupBySlugInterface";
import type { CiAuthMode } from "../../../";

export interface CiGetTenantLookupBySlugApiInterface
  extends CiGetTenantLookupBySlugInterface {
  authMode: CiAuthMode;
}
