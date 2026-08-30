import type {
  CiCreateOrgUnitInput,
  CiLocaleDirection,
  CiOrgUnitManagementRow,
  CiResourceLifecycleMutationResult,
  CiTenantHtmlTableRow,
  CiUpdateOrgUnitInput,
} from "@cloudigniter/core/types";
import type { CiTenantManagementPageProps } from "../tenant-management-types";

export type CiOrgUnitManagementPageProps = {
  orgUnits: CiOrgUnitManagementRow[];
  tenants: CiTenantHtmlTableRow[];
  canManage: boolean;
  direction?: CiLocaleDirection;
  locale?: string;
  onCreate?: (
    input: CiCreateOrgUnitInput,
  ) => Promise<CiResourceLifecycleMutationResult<CiOrgUnitManagementRow>>;
  onUpdate?: (
    input: CiUpdateOrgUnitInput,
  ) => Promise<CiResourceLifecycleMutationResult<CiOrgUnitManagementRow>>;
  developmentSeeder?: CiTenantManagementPageProps["developmentSeeder"];
};
