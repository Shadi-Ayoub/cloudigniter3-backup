export type CiSystemTableItem = {
  PK: string; // "SETTING#core"
  SK: string; // "META"
  type: 'SETTING';
  tenantId: string; // "default"
  name?: string;
  description?: string;
  data: any; // JSON object (preferred) or stringified JSON if you want
  createdAt?: string;
  updatedAt?: string;
};
