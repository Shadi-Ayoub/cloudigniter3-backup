import type { CiOrgUnitData } from './CiOrgUnitData';

/** Shape of an OU node when building a tree for the UI. */
export interface CiOrgUnitNode extends CiOrgUnitData {
  tenantId: string;
  name: string;
  description?: string;
  children: CiOrgUnitNode[];
}
