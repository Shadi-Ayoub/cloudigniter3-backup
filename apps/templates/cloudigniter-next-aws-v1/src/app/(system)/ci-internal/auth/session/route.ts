import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerRunner } from "@aws-amplify/adapter-nextjs";
import { fetchAuthSession } from "aws-amplify/auth/server";

import amplifyOutputs from "@/../amplify_outputs.json";
import type { CiAmplifyOutputs } from "@cloudigniter/aws/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const { runWithAmplifyServerContext } = createServerRunner({
  config: amplifyOutputs as CiAmplifyOutputs,
});

export async function POST() {
  try {
    const session = await runWithAmplifyServerContext({
      // ✅ pass the cookies() function (Server Components context shape)
      nextServerContext: { cookies },
      operation: async (ctx) => fetchAuthSession(ctx),
    });

    const authenticated =
      !!session.tokens?.idToken && !!session.tokens?.accessToken;

    return NextResponse.json(
      { ok: true, authenticated },
      { status: authenticated ? 200 : 401 },
    );
  } catch (e) {
    console.error("[auth/session] fetchAuthSession failed:", e);
    return NextResponse.json(
      { ok: false, authenticated: false },
      { status: 401 },
    );
  }
}
