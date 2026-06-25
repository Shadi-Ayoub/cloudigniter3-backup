// Ensure this runs in Node.js (not Edge) so you can use AWS SDK / Amplify server libs safely.
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import { ciNormalizeThrownError } from "@cloudigniter/core/lib";

import type {
  CiEnvMode,
  CiGetTenantBySlugInterface,
  CiRequest,
} from "@cloudigniter/core/types";

import * as apiOnServer from "@/kernel/server/api";

/**
 * Resolves a Tenant by its route-safe slug.
 *
 * Query parameters:
 * - tenant: Tenant slug
 *
 * The server API owns validation, data access, and canonical response shaping.
 */
export async function GET(req: NextRequest) {
  const slug =
    req.nextUrl.searchParams.get("tenant")?.trim().toLowerCase() ?? "";

  if (!slug) {
    return NextResponse.json(
      {
        statusCode: 400,
        body: {
          error: {
            message: "The 'tenant' query parameter is required.",
          },
        },
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

    return NextResponse.json(result, {
      status: result.statusCode ?? 200,
    });
  } catch (error: unknown) {
    const normalizedError = ciNormalizeThrownError(error);

    console.error("[Tenant Lookup] Unexpected error:", normalizedError.message);

    return NextResponse.json(
      {
        statusCode: 500,
        body: {
          error: normalizedError,
        },
      },
      { status: 500 },
    );
  }
}
