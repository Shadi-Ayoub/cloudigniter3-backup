import type {
  CiSecurityCapabilities,
  CiSecurityMutationResult,
  CiPrivilege,
  CiSecurityRecord,
  CiSecurityRecordKind,
  CiRoleStatus,
  CiResourceDomainStatus,
  CiResourceStatus,
  CiSecurityResourceDomainRecord,
  CiCreateSecurityResourceDomainInput,
} from "@cloudigniter/core/types";

export type CiSecurityDataPageProps = {
  kind: CiSecurityRecordKind;
  title: string;
  description: string;
  records: CiSecurityRecord[];
  capabilities: CiSecurityCapabilities;
  providerLabel?: string;
  roleOptions?: Array<{ id: string; label: string; inherits: string[] }>;
  privilegeOptions?: Array<{
    id: string;
    label: string;
    description: string;
    sourceRoleId: string;
    privilege: CiPrivilege;
  }>;
  resourceOptions?: Array<{ id: string; label: string; actions: string[] }>;
  resourceDomains?: CiSecurityResourceDomainRecord[];
  onSave?: (
    record: CiSecurityRecord,
    reason?: string
  ) => Promise<CiSecurityMutationResult>;
  onDelete?: (
    record: CiSecurityRecord,
    reason?: string
  ) => Promise<CiSecurityMutationResult>;
  onSetRoleStatus?: (
    roleId: string,
    status: CiRoleStatus,
    reason: string
  ) => Promise<CiSecurityMutationResult>;
  onCreateResourceDomain?: (
    input: CiCreateSecurityResourceDomainInput
  ) => Promise<CiSecurityMutationResult>;
  onSetResourceDomainStatus?: (
    domainId: string,
    status: CiResourceDomainStatus,
    reason: string
  ) => Promise<CiSecurityMutationResult>;
  onSetResourceStatus?: (
    resourceId: string,
    status: CiResourceStatus,
    reason: string
  ) => Promise<CiSecurityMutationResult>;
};
