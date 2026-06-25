import { cache } from "react";

import { ciNormalizePathname } from "@ci-core/lib";

import type {
  CiGetOrgUnitByPathInterface,
  CiOrgUnitContext,
  CiRequest,
  CiResponse,
} from "@ci-core/types";

const CI_MOCK_ORG_UNITS: CiOrgUnitContext[] = [
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
];

/**
 * Resolves an Org Unit by its canonical hierarchical path within a Tenant
 * using temporary mock data.
 *
 * Replace this implementation with the Amplify-backed lookup once the routing
 * and Org Unit resolution flow have been verified.
 */
export const appGetOrgUnitLookupByPath = cache(
  async (
    request: CiRequest<CiGetOrgUnitByPathInterface>,
  ): Promise<CiResponse> => {
    const tenantId = request.input.tenantId.trim();
    const orgUnitPath = ciNormalizePathname(request.input.orgUnitPath);

    if (!tenantId || orgUnitPath === "/") {
      return {
        ok: false,
        statusCode: 400,
        body: {
          error: "Tenant id and Org Unit path are required.",
        },
      };
    }

    const orgUnit = CI_MOCK_ORG_UNITS.find(
      (item) => item.tenantId === tenantId && item.path === orgUnitPath,
    );

    if (!orgUnit) {
      return {
        ok: true,
        statusCode: 200,
        body: {
          exists: false,
          tenantId,
          path: orgUnitPath,
        },
      };
    }

    return {
      ok: true,
      statusCode: 200,
      body: {
        exists: true,
        ...orgUnit,
      },
    };
  },
);
