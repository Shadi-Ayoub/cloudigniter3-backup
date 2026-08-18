import type {
  CiAccessControlDefinition,
  CiAccessScope,
  CiAccessScopeKind,
  CiPrivilege,
  CiRoleAssignment,
  CiRoleStatus,
  CiRoleStatusChange,
  CiResourceDomainStatus,
  CiResourceDomainStatusChange,
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
  status?: CiRoleStatus;
  statusChange?: CiRoleStatusChange;
  precedence: number;
  inherits: string[];
  privileges: CiPrivilege[];
  permissionCount: number;
  /** Unique users with a stored assignment to this exact role. */
  directUserCount: number;
  /** Unique users connected through a non-suspended inheritance path. */
  inheritedUserCount: number;
};

/** Mutation-maintained counters displayed for one security role. */
export type CiSecurityRoleCounters = {
  permissionCount: number;
  directUserCount: number;
  inheritedUserCount: number;
};

/** Persisted role-counter projection keyed by stable role ID. */
export type CiSecurityRoleCountersById = Record<string, CiSecurityRoleCounters>;

/** Requests a deliberate, reasoned role suspension or restoration. */
export type CiSetSecurityRoleStatusInput = {
  roleId: string;
  status: CiRoleStatus;
  reason: string;
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

/** Resource-domain row shown in the catalog's domain-management dialog. */
export type CiSecurityResourceDomainRecord = CiSecurityBaseRecord & {
  status: CiResourceDomainStatus;
  statusChange?: CiResourceDomainStatusChange;
  resourceCount: number;
};

/** Creates one application-owned resource domain. */
export type CiCreateSecurityResourceDomainInput = {
  id: string;
  title: string;
  description?: string;
};

/** Requests a deliberate, reasoned domain suspension or restoration. */
export type CiSetSecurityResourceDomainStatusInput = {
  domainId: string;
  status: CiResourceDomainStatus;
  reason: string;
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
  /** Denormalized tenant key used by provider assignment indexes. */
  tenantId?: string;
};

export type CiSecurityAdministrationRepository = {
  getAccessControlDefinition(): Promise<CiAccessControlDefinition | null>;
  getRoleCounters(): Promise<CiSecurityRoleCountersById>;
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
  clock?: () => Date;
};

export type CiSecurityAdministration = {
  readonly capabilities: CiSecurityCapabilities;
  loadDefinition(): Promise<CiAccessControlDefinition>;
  loadRoleCounters(): Promise<CiSecurityRoleCountersById>;
  loadAssignments(): Promise<readonly CiSecurityStoredRoleAssignment[]>;
  buildRecords(
    definition: CiAccessControlDefinition,
    assignments: readonly CiSecurityStoredRoleAssignment[],
    roleCounters: CiSecurityRoleCountersById
  ): CiSecurityRecordsByKind;
  buildResourceDomains(
    definition: CiAccessControlDefinition
  ): CiSecurityResourceDomainRecord[];
  createResourceDomain(input: CiCreateSecurityResourceDomainInput): Promise<void>;
  setResourceDomainStatus(
    input: CiSetSecurityResourceDomainStatusInput
  ): Promise<void>;
  saveRecord(record: CiSecurityRecord, reason?: string): Promise<void>;
  setRoleStatus(input: CiSetSecurityRoleStatusInput): Promise<void>;
  deleteRecord(record: CiSecurityRecord): Promise<void>;
};

export type CiSecurityAssignmentScope = CiAccessScope;
