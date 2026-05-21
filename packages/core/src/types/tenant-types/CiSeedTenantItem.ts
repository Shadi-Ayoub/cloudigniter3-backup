import type { CiCreateTenantInterface } from "./CiCreateTenantInterface";

export interface CiSeedTenantItem extends CiCreateTenantInterface {
  seedSetId: string;
  seededBy: string;
}
