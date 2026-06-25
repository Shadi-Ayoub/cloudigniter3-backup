// Ensure this runs in Node.js (not Edge) so you can use AWS SDK / Amplify server libs safely.
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  ciNormalizePathname,
  ciNormalizeThrownError,
} from "@cloudigniter/core/lib";

import type {
  CiEnvMode,
  CiGetOrgUnitByPathInterface,
  CiRequest,
} from "@cloudigniter/core/types";

// import * as apiOnServer from "@/kernel/server/api";
import { appGetOrgUnitLookupByPath } from "@/kernel/server/api/system/org-unit/app-get-org-unit-lookup-by-path";

/**
 * Resolves an Org Unit by its canonical hierarchical path within a Tenant.
 *
 * Query parameters:
 * - tenant: Tenant identifier
 * - path: Canonical Org Unit pathname
 *
 * The server API owns validation, data access, and canonical response shaping.
 */
export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get("tenant")?.trim() ?? "";
  const rawOrgUnitPath = req.nextUrl.searchParams.get("path") ?? "";

  if (!tenantId || !rawOrgUnitPath) {
    return NextResponse.json(
      {
        error: "Both 'tenant' and 'path' query parameters are required.",
      },
      { status: 400 },
    );
  }

  const request: CiRequest<CiGetOrgUnitByPathInterface> = {
    input: {
      tenantId,
      orgUnitPath: ciNormalizePathname(rawOrgUnitPath),
    },
    envMode: (process.env.NEXT_PUBLIC_CI_ENV_MODE ?? "test") as CiEnvMode,
  };

  try {
    // const result = await apiOnServer.appGetOrgUnitLookupByPath(request);
    const result = await appGetOrgUnitLookupByPath(request);

    return NextResponse.json(result.body, {
      status: result.statusCode,
    });
  } catch (error: unknown) {
    const normalizedError = ciNormalizeThrownError(error);

    return NextResponse.json(
      {
        error: normalizedError.message,
      },
      { status: 500 },
    );
  }
}
