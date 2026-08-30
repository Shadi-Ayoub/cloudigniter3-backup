import type {
  CiDeleteTenantInput,
  CiPurgeTenantInput,
  CiResourceLifecycleMutationResult,
  CiRestoreTenantInput,
  CiSetTenantStatusInput,
  CiTenantHtmlTableRow,
  CiTenantSeederExecutionResult,
} from "@cloudigniter/core/types";

export type CiTenantManagementCapabilities = {
  canDelete: boolean;
  canSetStatus?: boolean;
  canRestore: boolean;
  canPurge: boolean;
};

export type CiTenantManagementPageProps = {
  mode: "active" | "trash";
  tenants: CiTenantHtmlTableRow[];
  capabilities: CiTenantManagementCapabilities;
  onDelete?: (
    input: CiDeleteTenantInput,
  ) => Promise<CiResourceLifecycleMutationResult<CiTenantHtmlTableRow>>;
  onSetStatus?: (
    input: CiSetTenantStatusInput,
  ) => Promise<CiResourceLifecycleMutationResult<CiTenantHtmlTableRow>>;
  onRestore?: (
    input: CiRestoreTenantInput,
  ) => Promise<CiResourceLifecycleMutationResult<CiTenantHtmlTableRow>>;
  onPurge?: (
    input: CiPurgeTenantInput,
  ) => Promise<CiResourceLifecycleMutationResult>;
  developmentSeeder?: {
    id: string;
    title: string;
    description?: string;
    onSeed: () => Promise<CiTenantSeederExecutionResult>;
    onCleanup: () => Promise<CiTenantSeederExecutionResult>;
  };
};
