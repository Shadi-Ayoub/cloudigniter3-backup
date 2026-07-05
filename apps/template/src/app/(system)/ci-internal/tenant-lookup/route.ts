// Ensure this runs in Node.js (not Edge) so you can use AWS SDK / Amplify server libs safely.
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ciNormalizeThrownError } from "@cloudigniter/core/lib";

import type {
  CiEnvMode,
  CiGetTenantBySlugInterface,
  CiRequest,
} from "@cloudigniter/core/types";

import * as apiOnServer from "@/kernel/server/api";

/**
 * Resolves a Tenant by its slug.
 *
 * Query parameters:
 * - tenant: Tenant slug
 */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("tenant")?.trim() ?? "";

  if (!slug) {
    return NextResponse.json(
      {
        error: "The 'tenant' query parameter is required.",
      },
      { status: 400 },
    );
  }

  const request: CiRequest<CiGetTenantBySlugInterface> = {
    input: {
      slug,
    },
    envMode: (process.env.NEXT_PUBLIC_CI_ENV_MODE ?? "test") as CiEnvMode,
  };

  try {
    const result = await apiOnServer.appGetTenantLookupBySlug(request);

    return NextResponse.json(result.body, {
      status: result.statusCode,
    });
  } catch (error: unknown) {
    const normalizedError = ciNormalizeThrownError(error);

    console.error("[Tenant Lookup] Unexpected error:", normalizedError.message);

    return NextResponse.json(
      {
        error: normalizedError.message,
      },
      { status: 500 },
    );
  }
}
