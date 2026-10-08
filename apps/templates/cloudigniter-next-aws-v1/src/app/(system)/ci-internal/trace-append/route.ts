import { NextResponse, type NextRequest } from "next/server";
import { CiTraceLoggerServer } from "@cloudigniter/core/server";
import type { CiNextCoreConfig } from "@cloudigniter/next/types";
import { appGetCoreConfig } from "@/kernel/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Parse once
  const body = await req.json().catch(() => ({}));

  // Tag resolver (unchanged)
  const q = req.nextUrl.searchParams;
  const tag =
    (q.get("tag") ?? q.get("t") ?? (typeof body?.tag === "string" ? body.tag : "client"))
      .trim()
      .replace(/[^A-Za-z0-9_\-\/\.:]/g, "")
      .slice(0, 64) || "client";

  // Load config
  let cfg: CiNextCoreConfig;
  try {
    cfg = appGetCoreConfig();
  } catch (e) {
    return NextResponse.json({ ok: false, error: "config" }, { status: 500 });
  }

  const traceLog = cfg.dev.traceLog;

  // ---- DIAGNOSTIC (temporary; remove later) ----
  // console.log('[trace-append] diag', {
  //   NEXT_RUNTIME: process.env.NEXT_RUNTIME,
  //   node: !!process.versions?.node,
  //   enabledInConfig: traceLog?.enabled,
  //   filePath: traceLog?.filePath,
  //   LOG_ENABLED: process.env.LOG_ENABLED ?? 'unset',
  // });

  // Treat undefined as enabled=true (safer default for “dev beacons”)
  const enabled = (traceLog?.enabled ?? true) === true;
  if (!enabled) return new NextResponse(null, { status: 204 });

  // Optional global kill-switch; default allow if unset
  if ((process.env.LOG_ENABLED ?? "true") !== "true") {
    return new NextResponse(null, { status: 204 });
  }

  // Must have a filePath to write
  if (!traceLog?.filePath) {
    if (traceLog?.debug) {
      console.warn("[trace-append] traceLog.filePath missing; skipping write.");
    }
    return new NextResponse(null, { status: 204 });
  }

  const logger = new CiTraceLoggerServer({
    ...traceLog,
    source: "server",
    tag,
    enabled: true,
  });

  try {
    const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : { msg: String(body) };

    logger.log({
      ...payload,
      via: "api",
      tag,
      route: req.nextUrl.pathname,
    });

    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error("ROUTE POST ERROR:", e);
    return new NextResponse(null, { status: 204 });
  }
}
