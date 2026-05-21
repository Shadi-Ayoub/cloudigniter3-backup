import { cookies } from 'next/headers';

export type CiCookieEntry = { name: string; value: string };

/**
 * Read all request cookies whose name starts with "ci-".
 * - Returns a plain object map.
 * - If duplicate cookie names exist, later ones overwrite earlier ones.
 * - A Server-only utility (Next.js App Router)!
 * - e.g. const ciCookies = await getCiCookies();
 */
export async function ciGetCookies() {
  const cookies = await readCiCookiesMap();

  return cookies;
}

/**
 * Read all request cookies whose name starts with "ci-".
 * - Server-only (uses next/headers).
 * eg. const ciCookies = await readCiCookiesMap();
 */
async function readCiCookies(prefix = 'ci-'): Promise<CiCookieEntry[]> {
  const c = await resolveMaybePromise(cookies());
  const p = prefix.toLowerCase();

  const out: CiCookieEntry[] = [];
  for (const ck of c.getAll()) {
    if (ck.name.toLowerCase().startsWith(p)) out.push({ name: ck.name, value: ck.value });
  }

  return out;
}

/**
 * Same as readCiCookies(), but returns a plain object map.
 * If duplicate cookie names exist, later ones overwrite earlier ones.
 */
async function readCiCookiesMap(prefix = 'ci-'): Promise<Record<string, string>> {
  const entries = await readCiCookies(prefix);
  return Object.fromEntries(entries.map((x) => [x.name, x.value]));
}

async function resolveMaybePromise<T>(x: T | Promise<T>): Promise<T> {
  return await x;
}
