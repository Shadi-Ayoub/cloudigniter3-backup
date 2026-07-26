import type { CiOrgUnitContext, CiOrgUnitRoutingOptions } from "@ci-core/types";
import { CI_DEV_TENANT_RESOLUTION_PROBES } from "../tenant/constants";

export const CI_DEFAULT_ORG_UNIT_PATH_HEADER_NAME = "x-ci-org-unit-path";
export const CI_DEFAULT_ORG_UNIT_PATH_COOKIE_NAME = "ci-org-unit-path";

/**
 * Default Org Unit routing options.
 */
export const CI_DEFAULT_ORG_UNIT_OPTIONS: Required<CiOrgUnitRoutingOptions> = {
  /**
   * Org Units are disabled by default to preserve backward compatibility.
   */
  enabled: false,

  /**
   * Internal middleware validation endpoint.
   */
  lookupPath: "/ci-internal/org-unit-lookup",

  suspendedPath: "/org-unit/suspended",

  maxDepth: 5,

  enforceStatus: true,
};

export const CI_MOCK_ORG_UNITS: CiOrgUnitContext[] = [
  {
    id: "org_acme_hr",
    tenantId: "acme",
    parentId: null,
    slug: "hr",
    name: "Human Resources",
    path: "/hr",
    status: "active",
  },
  {
    id: "org_acme_student_services",
    tenantId: "acme",
    parentId: null,
    slug: "student-services",
    name: "Student Services",
    path: "/student-services",
    status: "suspended",
  },
  {
    id: "org_acme_academic",
    tenantId: "acme",
    parentId: null,
    slug: "academic",
    name: "Academic Affairs",
    path: "/academic",
    status: "active",
  },
  {
    id: "org_acme_grade_10",
    tenantId: "acme",
    parentId: "org_acme_academic",
    slug: "grade-10",
    name: "Grade 10",
    path: "/academic/grade-10",
    status: "active",
  },
  {
    id: "org_acme_math",
    tenantId: "acme",
    parentId: "org_acme_grade_10",
    slug: "math",
    name: "Mathematics Department",
    path: "/academic/grade-10/math",
    status: "active",
  },
  {
    id: "org_acme_physics",
    tenantId: "acme",
    parentId: "org_acme_grade_10",
    slug: "physics",
    name: "Physics Department",
    path: "/academic/grade-10/physics",
    status: "archived",
  },
  {
    id: "ci_probe_org_6f7a2d91_root",
    tenantId: CI_DEV_TENANT_RESOLUTION_PROBES.tenant.active,
    parentId: null,
    slug: "ci-probe-org-6f7a2d91-root",
    name: "CloudIgniter Resolution Probe Root",
    path: CI_DEV_TENANT_RESOLUTION_PROBES.orgUnit.root,
    status: "active",
  },
  {
    id: "ci_probe_org_6f7a2d91_branch_31f7",
    tenantId: CI_DEV_TENANT_RESOLUTION_PROBES.tenant.active,
    parentId: "ci_probe_org_6f7a2d91_root",
    slug: "branch-31f7",
    name: "CloudIgniter Resolution Probe Branch",
    path: CI_DEV_TENANT_RESOLUTION_PROBES.orgUnit.branch,
    status: "active",
  },
  {
    id: "ci_probe_org_6f7a2d91_leaf_6ac0",
    tenantId: CI_DEV_TENANT_RESOLUTION_PROBES.tenant.active,
    parentId: "ci_probe_org_6f7a2d91_branch_31f7",
    slug: "leaf-6ac0",
    name: "CloudIgniter Resolution Probe Leaf",
    path: CI_DEV_TENANT_RESOLUTION_PROBES.orgUnit.deep,
    status: "active",
  },
  {
    id: "ci_probe_org_6f7a2d91_suspended",
    tenantId: CI_DEV_TENANT_RESOLUTION_PROBES.tenant.active,
    parentId: null,
    slug: "ci-probe-org-6f7a2d91-suspended",
    name: "CloudIgniter Resolution Probe Suspended",
    path: CI_DEV_TENANT_RESOLUTION_PROBES.orgUnit.suspended,
    status: "suspended",
  },
  {
    id: "ci_probe_org_6f7a2d91_archived",
    tenantId: CI_DEV_TENANT_RESOLUTION_PROBES.tenant.active,
    parentId: null,
    slug: "ci-probe-org-6f7a2d91-archived",
    name: "CloudIgniter Resolution Probe Archived",
    path: CI_DEV_TENANT_RESOLUTION_PROBES.orgUnit.archived,
    status: "archived",
  },
];
