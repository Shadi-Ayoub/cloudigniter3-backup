import type { CiSeederExecutionResult } from "../dev-types/seeder-types";
import type { CiTenantHtmlTableRow } from "./CiTenantHtmlTableRow";
import type { CiTenantStatus } from "./CiTenantStatus";
import type {
  CiOrgUnitManagementRow,
  CiOrgUnitSeederDataItem,
} from "../org-unit-types";

export type CiTenantSeederDataItem = {
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  status?: CiTenantStatus;
  region?: string;
  tenantType?: string;
  usersCount?: number;
  meta?: Record<string, unknown>;
  /** Disposable Org Units created after this seeder's tenants. */
  orgUnits?: CiOrgUnitSeederDataItem[];
};

export type CiSeedTenantsInput = {
  seederId: string;
  items: CiTenantSeederDataItem[];
};

export type CiCleanupSeededTenantsInput = {
  seederId: string;
};

export type CiTenantSeederExecutionResult =
  CiSeederExecutionResult<CiTenantHtmlTableRow> & {
    /** Authoritative Org Unit rows created or already owned by this seeder. */
    orgUnits?: CiOrgUnitManagementRow[];
  };
