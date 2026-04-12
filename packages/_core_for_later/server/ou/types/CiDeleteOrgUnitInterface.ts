export interface CiDeleteOrgUnitInterface {
  tenantId: string;
  path: string; // full OU path
  forceDeleteTree?: boolean;
}
