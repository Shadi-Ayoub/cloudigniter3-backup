import type {
  CICreateUserInput,
  CIDeleteUserInput,
  CIPurgeUserInput,
  CIRestoreUserInput,
  CISetUserStatusInput,
  CIUpdateUserInput,
  CIImpersonateUserInput,
  CIUser,
  CIUserMutationResult,
  CIUserSeederExecutionResult,
} from "@cloudigniter/core/types";

export type CiUserManagementRoleOption = {
  id: string;
  label: string;
};

export type CiUserManagementCapabilities = {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canAssignRoles: boolean;
  canDelegateSystemSuperAdminManagement?: boolean;
  canEmail: boolean;
  canImpersonate: boolean;
};

export type CiUserManagementOption = {
  value: string;
  label: string;
};

export type CiUserManagementPageProps = {
  mode?: "active" | "trash";
  managementKind?: "users" | "administrators";
  users: CIUser[];
  providerLabel: string;
  roleOptions: CiUserManagementRoleOption[];
  /** Complete role vocabulary used by filters/details; editor options may be narrower. */
  filterRoleOptions?: CiUserManagementRoleOption[];
  assignmentRoleOptions?: CiUserManagementRoleOption[];
  localeOptions: CiUserManagementOption[];
  timeZoneOptions: CiUserManagementOption[];
  /** Explicit render locale; never infer it independently in the browser. */
  locale?: string;
  actor?: {
    userId: string;
    roles: string[];
    isRootUser: boolean;
    canManageSystemSuperAdmins: boolean;
  };
  capabilities: CiUserManagementCapabilities;
  onCreate?: (input: CICreateUserInput) => Promise<CIUserMutationResult>;
  onUpdate?: (input: CIUpdateUserInput) => Promise<CIUserMutationResult>;
  onRead?: (userId: string) => Promise<CIUserMutationResult>;
  onEmail?: (user: CIUser) => void | Promise<void>;
  onImpersonate?: (
    input: CIImpersonateUserInput,
  ) => Promise<CIUserMutationResult>;
  onSetStatus?: (input: CISetUserStatusInput) => Promise<CIUserMutationResult>;
  onDelete?: (input: CIDeleteUserInput) => Promise<CIUserMutationResult>;
  onRestore?: (input: CIRestoreUserInput) => Promise<CIUserMutationResult>;
  onPurge?: (input: CIPurgeUserInput) => Promise<CIUserMutationResult>;
  developmentSeeder?: {
    id: string;
    title: string;
    description?: string;
    onSeed: () => Promise<CIUserSeederExecutionResult>;
    onCleanup: () => Promise<CIUserSeederExecutionResult>;
  };
};
