import type { CiOrgUnitStatus } from "./CiOrgUnitStatus";

export type CiOrgUnitDdbTableItem = {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  GSI2PK: string;
  GSI2SK: string;
  id: string;
  type: "ORG_UNIT";
  status: CiOrgUnitStatus;
  name: string;
  description?: string;
  deletionState: "active";
  data: {
    slug: string;
    path: string;
    parentId: string | null;
    ancestorOrgUnitIds: string[];
    tenantIds: string[];
    childIds?: string[];
    seed?: {
      seederId: string;
      seededAt: string;
      seededBy: string;
    };
    meta?: Record<string, unknown>;
  };
  createdAt: string;
  updatedAt: string;
  version: number;
};
