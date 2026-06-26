import type { CiDevResolutionCheck } from "./CiDevResolutionCheck";

export type CiDevTenantResolutionCheckup = {
  tenant: {
    passed: number;
    failed: number;
    total: number;
  };
  orgUnit: {
    passed: number;
    failed: number;
    total: number;
  };
  checks: CiDevResolutionCheck[];
};
