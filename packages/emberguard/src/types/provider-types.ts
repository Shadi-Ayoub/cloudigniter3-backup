import type {
  CiAccessControlDefinition,
  CiResourceDefinition,
  CiResourceDomainDefinition,
  CiRoleAssignment,
} from "./access-control-types";

export type CiEmberguardProviderName = "aws" | (string & {});

export type CiEmberguardResourceInventoryRecord = {
  id: string;
  tenantId?: string;
  domainId: string;
  resourceId: string;
  provider: CiEmberguardProviderName;
  source?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type CiEmberguardStoredRoleAssignment = CiRoleAssignment & {
  id: string;
  subjectId: string;
  tenantId?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CiEmberguardCustomDomainRecord = {
  id: string;
  domainName: string;
  tenantId?: string;
  status?: "active" | "pending" | "disabled";
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type CiEmberguardRepository = {
  getAccessControlDefinition(): Promise<CiAccessControlDefinition | null>;
  saveAccessControlDefinition(definition: CiAccessControlDefinition): Promise<void>;

  listResourceDomains(): Promise<readonly CiResourceDomainDefinition[]>;
  putResourceDomain(domain: CiResourceDomainDefinition): Promise<void>;

  listResources(input?: {
    domainId?: string;
  }): Promise<readonly CiResourceDefinition[]>;
  putResource(resource: CiResourceDefinition): Promise<void>;

  listResourceInventory(input?: {
    tenantId?: string;
    domainId?: string;
  }): Promise<readonly CiEmberguardResourceInventoryRecord[]>;
  putResourceInventoryRecord(record: CiEmberguardResourceInventoryRecord): Promise<void>;

  listRoleAssignments(input: {
    subjectId?: string;
    tenantId?: string;
  }): Promise<readonly CiEmberguardStoredRoleAssignment[]>;
  putRoleAssignment(assignment: CiEmberguardStoredRoleAssignment): Promise<void>;
  deleteRoleAssignment(input: { id: string; subjectId: string }): Promise<void>;

  listCustomDomains(input?: {
    tenantId?: string;
  }): Promise<readonly CiEmberguardCustomDomainRecord[]>;
  putCustomDomain(record: CiEmberguardCustomDomainRecord): Promise<void>;
  deleteCustomDomain(input: { id: string; tenantId?: string }): Promise<void>;
};

export type CiEmberguardProvider = {
  name: CiEmberguardProviderName;
  repository: CiEmberguardRepository;
};

export type CiEmberguardOptions = {
  definition?: CiAccessControlDefinition;
};
