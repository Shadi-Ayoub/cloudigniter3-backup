"use server";

// Ensure this runs in Node.js (not Edge) so you can use AWS SDK / Amplify server libs safely.
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import { ciNormalizeThrownError } from "@cloudigniter/core/lib";
import type { CiRequest } from "@cloudigniter/core/types";

import * as apiOnServer from "@/kernel/server/api";

export async function POST(req: NextRequest) {
  const request = (await req.json()) as CiRequest;

  try {
    const result = await apiOnServer.appGetTenantLookupBySlug(request);

    return NextResponse.json(result, { status: result.statusCode ?? 200 });
  } catch (error: unknown) {
    const normalizedError = ciNormalizeThrownError(error);

    console.error("[Seeder] Unexpected error:", normalizedError.message);

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

// import { NextRequest, NextResponse } from 'next/server';

// export async function GET(req: NextRequest) {
//   const slug = req.nextUrl.searchParams.get('slug')?.trim().toLowerCase();
//   if (!slug) {
//     return NextResponse.json({ exists: false }, { status: 400 });
//   }

//   // TODO: perform DynamoDB lookup (fast key lookup, no scan).
//   // Example result:
//   // const tenant = await getTenantBySlug(slug);

//   const tenant = null as any; // replace

//   if (!tenant) {
//     return NextResponse.json({ exists: false }, { status: 200 });
//   }

//   return NextResponse.json(
//     {
//       exists: true,
//       status: tenant.status ?? 'active',
//       tenantId: tenant.id ?? tenant.tenantId,
//       slug,
//     },
//     { status: 200 }
//   );
// }
