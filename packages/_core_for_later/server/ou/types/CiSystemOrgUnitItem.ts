import type { CiSystemItemType } from '@CI/types';
import type { CiOrgUnitData } from './CiOrgUnitData';

export interface CiSystemOrgUnitItem {
  PK: string; // "OU#<tenantId>"
  SK: string; // "PATH#<path>"

  type: CiSystemItemType; // "ORG_UNIT"
  tenantId: string;

  name: string;
  description?: string;

  data: CiOrgUnitData;

  createdAt: string;
  updatedAt: string;
}
