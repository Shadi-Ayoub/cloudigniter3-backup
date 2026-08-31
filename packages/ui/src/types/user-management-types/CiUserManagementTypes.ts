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
  canEmail: boolean;
  canImpersonate: boolean;
};

export type CiUserManagementOption = {
  value: string;
  label: string;
};

export type CiUserManagementPageProps = {
  mode?: "active" | "trash";
  users: CIUser[];
  providerLabel: string;
  roleOptions: CiUserManagementRoleOption[];
  localeOptions: CiUserManagementOption[];
  timeZoneOptions: CiUserManagementOption[];
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
