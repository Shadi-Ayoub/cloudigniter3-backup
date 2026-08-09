import type { CiSettingsValue } from "@ci-core/types";

export type {
  CiSecurityActor,
  CiSecurityAdministration,
  CiSecurityAdministrationOptions,
  CiSecurityAdministrationRepository,
  CiSecurityAssignmentRecord,
  CiSecurityAssignmentScope,
  CiSecurityBaseRecord,
  CiSecurityCapabilities,
  CiSecurityEntryOrigin,
  CiSecurityIdentityGroup,
  CiSecurityIdentityGroupRecord,
  CiSecurityMutationResult,
  CiSecurityPermissionRecord,
  CiSecurityRecord,
  CiSecurityRecordKind,
  CiSecurityRecordsByKind,
  CiSecurityResourceRecord,
  CiSecurityRoleRecord,
  CiSecurityStoredRoleAssignment,
} from "@cloudigniter/emberguard/types";

export type CiSecuritySettings = {
  enable2FA: boolean;
  [key: string]: CiSettingsValue;
};
