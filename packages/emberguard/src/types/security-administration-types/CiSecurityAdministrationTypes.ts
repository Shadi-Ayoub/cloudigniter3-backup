import type {
  CiAccessControlDefinition,
  CiAccessScope,
  CiAccessScopeKind,
  CiRoleAssignment,
} from "../access-control-types";

export type CiSecurityEntryOrigin = "core" | "application" | "provider";

export type CiSecurityCapabilities = {
  canRead: boolean;
  canManageApplication: boolean;
  canManageCore: boolean;
  canManageAssignments: boolean;
  actorRole: string | null;
};

export type CiSecurityRecordKind =
  | "role"
  | "permission"
  | "resource"
  | "assignment"
  | "identity-group";

export type CiSecurityBaseRecord = {
  id: string;
  title: string;
  description?: string;
  origin: CiSecurityEntryOrigin;
  locked: boolean;
};

export type CiSecurityRoleRecord = CiSecurityBaseRecord & {
  kind: "role";
  precedence: number;
  inherits: string[];
  permissionCount: number;
};

export type CiSecurityPermissionRecord = CiSecurityBaseRecord & {
  kind: "permission";
  roleId: string;
  effect: "allow" | "deny";
  resource: string;
  action: string;
  scopeKinds: CiAccessScopeKind[];
  sensitive: boolean;
};

export type CiSecurityResourceRecord = CiSecurityBaseRecord & {
  kind: "resource";
  domainId: string;
  actions: string[];
  scopeKinds: CiAccessScopeKind[];
  sensitiveActionCount: number;
};

export type CiSecurityAssignmentRecord = CiSecurityBaseRecord & {
  kind: "assignment";
  subjectId: string;
  roleId: string;
  scopeKind: CiAccessScopeKind;
  scopeId?: string;
  propagation: "exact" | "descendants";
  expiresAt?: string;
};

export type CiSecurityIdentityGroupRecord = CiSecurityBaseRecord & {
  kind: "identity-group";
  provider: string;
  providerGroup: string;
  roleId: string;
  precedence?: number;
  status: "mapped" | "unmapped" | "drift";
};

export type CiSecurityRecord =
  | CiSecurityRoleRecord
  | CiSecurityPermissionRecord
  | CiSecurityResourceRecord
  | CiSecurityAssignmentRecord
  | CiSecurityIdentityGroupRecord;

export type CiSecurityMutationResult = {
  ok: boolean;
  message: string;
};

export type CiSecurityIdentityGroup = {
  id: string;
  provider: string;
  precedence?: number;
};

export type CiSecurityActor = {
  id: string;
  authenticated: boolean;
  roleIds: readonly string[];
  primaryRole: string | null;
};

export type CiSecurityStoredRoleAssignment = CiRoleAssignment & {
  id: string;
  subjectId: string;
};

export type CiSecurityAdministrationRepository = {
  getAccessControlDefinition(): Promise<CiAccessControlDefinition | null>;
  saveAccessControlDefinition(
    definition: CiAccessControlDefinition
  ): Promise<void>;
  listRoleAssignments(): Promise<readonly CiSecurityStoredRoleAssignment[]>;
  putRoleAssignment(assignment: CiSecurityStoredRoleAssignment): Promise<void>;
  deleteRoleAssignment(input: { id: string; subjectId: string }): Promise<void>;
};

export type CiSecurityRecordsByKind = {
  [Kind in CiSecurityRecordKind]: Array<
    Extract<CiSecurityRecord, { kind: Kind }>
  >;
};

export type CiSecurityAdministrationOptions = {
  actor: CiSecurityActor;
  definition: CiAccessControlDefinition;
  repository: CiSecurityAdministrationRepository;
  identityGroups?: readonly CiSecurityIdentityGroup[];
  createId?: () => string;
};

export type CiSecurityAdministration = {
  readonly capabilities: CiSecurityCapabilities;
  loadDefinition(): Promise<CiAccessControlDefinition>;
  loadAssignments(): Promise<readonly CiSecurityStoredRoleAssignment[]>;
  buildRecords(
    definition: CiAccessControlDefinition,
    assignments?: readonly CiSecurityStoredRoleAssignment[]
  ): CiSecurityRecordsByKind;
  saveRecord(record: CiSecurityRecord, reason?: string): Promise<void>;
  deleteRecord(record: CiSecurityRecord): Promise<void>;
};

export type CiSecurityAssignmentScope = CiAccessScope;
