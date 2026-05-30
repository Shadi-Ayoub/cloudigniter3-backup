import { NextResponse } from 'next/server';
import { getConfig } from '@/kernel';
import { promises as fsp } from 'node:fs';
import { open as fsOpen } from 'node:fs/promises';
import { resolve } from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function tailFileByBytes(
  filePath: string,
  maxBytes: number
): Promise<{ size: number; text: string }> {
  try {
    const fh = await fsOpen(filePath, 'r');
    try {
      const stat = await fh.stat();
      const size = stat.size;
      if (size === 0) return { size, text: '' };
      const start = Math.max(0, size - Math.max(1, maxBytes));
      const length = size - start;
      const buf = Buffer.alloc(length);
      await fh.read(buf, 0, length, start);
      return { size, text: buf.toString('utf8') };
    } finally {
      await fh.close();
    }
  } catch (e) {
    if (
      typeof e === 'object' &&
      e !== null &&
      (e as { code?: string }).code === 'ENOENT'
    ) {
      return { size: 0, text: '' };
    }
    throw e;
  }
}

function takeLastLines(text: string, maxLines: number): string[] {
  const lines = text.split(/\r?\n/);
  // keep empty lines if your log uses visual spacers
  if (lines.length <= maxLines) return lines;
  return lines.slice(-maxLines);
}

export async function GET(req: CiRequest) {
  const cfg = getConfig('api/trace:GET');
  const traceLog = cfg?.traceLog;
  const enabled = (traceLog?.enabled ?? true) === true;

  const url = new URL(req.url);
  const maxBytes = Math.min(
    Math.max(Number(url.searchParams.get('bytes')) || 65536, 1024),
    4 * 1024 * 1024
  );
  const maxLines = Math.min(
    Math.max(Number(url.searchParams.get('lines')) || 500, 10),
    5000
  );
  const format = (url.searchParams.get('format') || 'json').toLowerCase(); // 'json' | 'text'

  if (!enabled || !traceLog?.filePath) {
    if (format === 'text') {
      return new NextResponse('', {
        status: 200,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    }
    return NextResponse.json({
      size: 0,
      count: 0,
      events: [] as unknown[],
      nextSince: Date.now(),
    });
  }

  const absPath = resolve(traceLog.filePath);
  const { size, text } = await tailFileByBytes(absPath, maxBytes);
  const lines = takeLastLines(text, maxLines);

  if (format === 'text') {
    const body = lines.join('\n');
    return new NextResponse(body, {
      status: 200,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  // JSON mode kept for backwards-compat (parses JSON lines; ignores others)
  const events = lines
    .map((ln, i) => {
      try {
        const obj = JSON.parse(ln) as Record<string, unknown>;
        return {
          ts: typeof obj.ts === 'number' ? obj.ts : Date.now(),
          seq: typeof obj.seq === 'number' ? obj.seq : i + 1,
          phase:
            typeof obj.phase === 'string'
              ? obj.phase
              : typeof obj.event === 'string'
                ? obj.event
                : 'log',
          name:
            typeof obj.name === 'string'
              ? obj.name
              : typeof obj.msg === 'string'
                ? obj.msg
                : 'trace',
          level: typeof obj.level === 'string' ? obj.level : undefined,
          requestId:
            typeof obj.requestId === 'string' ? obj.requestId : undefined,
          traceId: typeof obj.traceId === 'string' ? obj.traceId : undefined,
          detail: (obj as unknown) ?? {},
          source: typeof obj.source === 'string' ? obj.source : 'server',
          tag: typeof obj.tag === 'string' ? obj.tag : undefined,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  return NextResponse.json({
    size,
    count: (events as unknown[]).length,
    events,
    nextSince: Date.now(),
  });
}

export async function DELETE() {
  const cfg = getConfig('api/trace:DELETE');
  const fp = cfg?.traceLog?.filePath;
  if (!fp) return new NextResponse(null, { status: 204 });
  try {
    await fsp.truncate(resolve(fp), 0);
  } catch (e) {
    if (
      !(
        typeof e === 'object' &&
        e !== null &&
        (e as { code?: string }).code === 'ENOENT'
      )
    ) {
      // swallow to keep quiet for Dev Beacon
    }
  }
  return new NextResponse(null, { status: 204 });
}

// // app/api/(ci)/trace/route.ts
// import { NextResponse } from 'next/server';
// import { getConfig } from '@/kernel';
// import { promises as fsp } from 'node:fs';
// import { open as fsOpen } from 'node:fs/promises';
// import { resolve } from 'node:path';

// export const runtime = 'nodejs';
// export const dynamic = 'force-dynamic';

// /** Normalized event shape returned to the client */
// interface TraceEvent {
//   ts: number;
//   seq: number;
//   phase: string;
//   name: string;
//   level?: string;
//   requestId?: string;
//   traceId?: string;
//   detail: unknown;
//   source?: string;
//   tag?: string;
// }

// /** Untrusted, raw JSONL object */
// type RawTrace = Record<string, unknown>;

// /** Read the last `maxBytes` bytes from a file (gracefully handles missing file). */
// async function tailFileByBytes(
//   filePath: string,
//   maxBytes: number
// ): Promise<{ size: number; text: string }> {
//   try {
//     const fh = await fsOpen(filePath, 'r');
//     try {
//       const stat = await fh.stat();
//       const size = stat.size;
//       if (size === 0) return { size, text: '' };
//       const start = Math.max(0, size - Math.max(1, maxBytes));
//       const length = size - start;
//       const buf = Buffer.alloc(length);
//       await fh.read(buf, 0, length, start);
//       return { size, text: buf.toString('utf8') };
//     } finally {
//       await fh.close();
//     }
//   } catch (e) {
//     // File not found yet: treat as empty
//     if (
//       typeof e === 'object' &&
//       e !== null &&
//       (e as { code?: string }).code === 'ENOENT'
//     ) {
//       return { size: 0, text: '' };
//     }
//     throw e;
//   }
// }

// /** Keep only the last N non-empty lines. */
// function takeLastLines(text: string, maxLines: number): string[] {
//   const lines = text.split(/\r?\n/).filter((ln) => ln.length > 0);
//   return lines.length <= maxLines ? lines : lines.slice(-maxLines);
// }

// /** Parse JSONL lines; ignore malformed lines without throwing. */
// function parseJsonl(lines: string[]): RawTrace[] {
//   const out: RawTrace[] = [];
//   for (const ln of lines) {
//     try {
//       const val = JSON.parse(ln) as unknown;
//       if (typeof val === 'object' && val !== null) {
//         out.push(val as RawTrace);
//       }
//     } catch {
//       // ignore non-JSON lines
//     }
//   }
//   return out;
// }

// /** Safe getter helpers (avoid `any`). */
// const asNum = (v: unknown): number | undefined =>
//   typeof v === 'number' && Number.isFinite(v) ? v : undefined;
// const asStr = (v: unknown): string | undefined =>
//   typeof v === 'string' && v.length > 0 ? v : undefined;

// /** Normalize a raw record into our TraceEvent shape. */
// function normalize(
//   raw: RawTrace,
//   fallbackSeq: number,
//   fallbackTs: number
// ): TraceEvent {
//   const ts = asNum(raw.ts) ?? fallbackTs;
//   // many loggers write `seq` or `__seq`; use either, else fallback
//   const seq = asNum(raw.seq) ?? asNum(raw.__seq as unknown) ?? fallbackSeq;
//   const phase = asStr(raw.phase) ?? asStr(raw.event) ?? 'log';
//   const name = asStr(raw.name) ?? asStr(raw.msg) ?? 'trace';

//   const level = asStr(raw.level);
//   const requestId = asStr(raw.requestId);
//   const traceId = asStr(raw.traceId);
//   const source = asStr(raw.source);
//   const tag = asStr(raw.tag);

//   // Put the original raw object into detail if no explicit detail exists
//   const detail: unknown = raw.detail ?? raw;

//   return {
//     ts,
//     seq,
//     phase,
//     name,
//     level,
//     requestId,
//     traceId,
//     detail,
//     source,
//     tag,
//   };
// }

// export async function GET(req: CiRequest) {
//   const cfg = getConfig('api/trace:GET');
//   const traceLog = cfg?.traceLog;
//   const enabled = (traceLog?.enabled ?? true) === true;

//   const url = new URL(req.url);
//   const maxBytes = Math.min(
//     Math.max(Number(url.searchParams.get('bytes')) || 65536, 1024),
//     4 * 1024 * 1024
//   );
//   const maxLines = Math.min(
//     Math.max(Number(url.searchParams.get('lines')) || 500, 10),
//     5000
//   );

//   if (!enabled || !traceLog?.filePath) {
//     return NextResponse.json({
//       size: 0,
//       count: 0,
//       events: [] as TraceEvent[],
//       nextSince: Date.now(),
//     });
//   }

//   const absPath = resolve(traceLog.filePath);
//   const { size, text } = await tailFileByBytes(absPath, maxBytes);
//   const lines = takeLastLines(text, maxLines);
//   const raw = parseJsonl(lines);

//   // Normalize with deterministic fallbacks
//   let seqCounter = 0;
//   const now = Date.now();
//   const events: TraceEvent[] = raw.map((r) => normalize(r, ++seqCounter, now));

//   return NextResponse.json({
//     size,
//     count: events.length,
//     events,
//     nextSince: Date.now(),
//   });
// }

// export async function DELETE() {
//   const cfg = getConfig('api/trace:DELETE');
//   const filePath = cfg?.traceLog?.filePath;
//   if (!filePath) return new NextResponse(null, { status: 204 });

//   try {
//     await fsp.truncate(resolve(filePath), 0);
//   } catch (e) {
//     // Ignore if file doesn't exist; rethrow others if you prefer JSON error
//     if (
//       !(
//         typeof e === 'object' &&
//         e !== null &&
//         (e as { code?: string }).code === 'ENOENT'
//       )
//     ) {
//       // Swallow to keep the API quiet for the Dev Beacon
//     }
//   }
//   return new NextResponse(null, { status: 204 });
// }
