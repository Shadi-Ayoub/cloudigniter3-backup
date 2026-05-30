import { headers } from 'next/headers';

export type CiHeaderEntry = { name: string; value: string };

/**
 * Read all request headers whose name starts with "x-ci-".
 * - Returns a plain object map.
 * - Header names are matched case-insensitively (HTTP headers are case-insensitive).
 * - A Server-only utility (Next.js App Router)!
 * - e.g. const ciHeaders = await getCiHeaders();
 */
export async function ciGetHeaders(prefix = 'x-ci-') {
  const headers = await readCiHeadersMap(prefix);

  return headers;
}

/**
 * Read all request headers whose name starts with "x-ci-".
 * - Server-only (uses next/headers).
 * - Header names are matched case-insensitively (HTTP headers are case-insensitive).
 */
async function readCiHeaders(prefix = 'x-ci-'): Promise<CiHeaderEntry[]> {
  const h = await resolveMaybePromise(headers());
  const p = prefix.toLowerCase();

  const out: CiHeaderEntry[] = [];
  h.forEach((value, name) => {
    if (name.toLowerCase().startsWith(p)) out.push({ name, value });
  });

  return out;
}

async function readCiHeadersMap(prefix = 'x-ci-'): Promise<Record<string, string>> {
  const entries = await readCiHeaders(prefix);
  return Object.fromEntries(entries.map((x) => [x.name, x.value]));
}

async function resolveMaybePromise<T>(x: T | Promise<T>): Promise<T> {
  return await x;
}
