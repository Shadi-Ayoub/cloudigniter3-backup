import type { CiRoute, CiRoutesMap, CiMatchedRoute } from "@ci-core/types";
import { ciNormalizePathname } from "@ci-core/lib";

type CompiledEntry = {
  pattern: string;
  route: CiRoute;
  rx: RegExp;
  score: number;
  len: number;
};

export type CiCompiledRoutes = {
  match: (path: string | URL) => CiMatchedRoute;
  isRegistered: (path: string | URL) => boolean;
  isProtected: (path: string | URL, defaultWhenNoMatch?: boolean) => boolean;
  resolve: (path: string | URL) => CiRoute | null;
  getNamespace: (path: string | URL) => string | undefined;
};

/**
 * Escape regex special chars in literals.
 */
function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Convert a route pattern to a regex.
 * Supports:
 * - '/admin/*'      -> matches '/admin' and deeper paths
 * - '/users/:id'    -> matches '/users/123' (single segment)
 * - exact paths     -> matched exactly
 */
function toRegex(pattern: string) {
  const pat = ciNormalizePathname(pattern);

  // Wildcard suffix: '/base/*'
  if (pat.endsWith("/*")) {
    const base = ciNormalizePathname(pat.slice(0, -2));
    // '^/base(?:/.*)?$' matches '/base' and any deeper path
    return new RegExp(`^${escapeRegex(base)}(?:/.*)?$`);
  }

  // Replace :param with single-segment matcher ([^/]+)
  // We escape the rest of the pattern safely:
  // split by param tokens and rebuild.
  const parts = pat.split(/(:[^/]+)/g).filter(Boolean);

  const rebuilt = parts
    .map((part) => (part.startsWith(":") ? "[^/]+" : escapeRegex(part)))
    .join("");

  return new RegExp(`^${rebuilt}$`);
}

/**
 * Rank patterns to choose the "most specific" match when multiple patterns match.
 * Higher score wins. Heuristics:
 *  - literal segments (+2)
 *  - param segments like :id (+1)
 *  - wildcard suffix '/*' (-1 penalty)
 *  - Then break ties by longer pattern length.
 */
function patternScore(pattern: string) {
  const pat = ciNormalizePathname(pattern);
  const segs = pat.split("/").filter(Boolean);

  let score = 0;
  for (const s of segs) {
    if (s === "*") {
      score -= 2; // safety
    } else if (s.startsWith(":")) {
      score += 1;
    } else {
      score += 2;
    }
  }
  if (pat.endsWith("/*")) score -= 1;
  return { score, len: pat.length };
}

/**
 * Compile routes into precomputed regex + scoring metadata.
 * This avoids rebuilding regexes on every request/match.
 *
 * Example:
 * // routes.matcher.ts
 * import { compileRoutes } from '@CI/route-utils';
 * import { routes } from './routes';
 * export const routesMatcher = compileRoutes(routes);
 *
 * // middleware
 * import { routesMatcher } from './routes.matcher';
 * const m1 = routesMatcher.match('/dashboard/users/123');
 * // => { pattern: '/dashboard/users/*', route: {...} }
 *
 * const isProtected = routesMatcher.isProtected('/dashboard/dev/install1');
 * // => false (exact match beats parent protected routes)
 *
 * const ns = routesMatcher.getNamespace('/dashboard');
 * // => 'dashboard'
 *
 * const ok = routesMatcher.isRegistered('/not-found');
 * // => false
 */
export function ciCompileRoutes(routes: CiRoutesMap): CiCompiledRoutes {
  const compiled: CompiledEntry[] = Object.entries(routes).map(
    ([pattern, route]) => {
      const rx = toRegex(pattern);
      const { score, len } = patternScore(pattern);
      return { pattern, route, rx, score, len };
    },
  );

  function match(path: string | URL): CiMatchedRoute {
    const p = ciNormalizePathname(path);

    let best: CompiledEntry | null = null;

    for (const entry of compiled) {
      if (!entry.rx.test(p)) continue;

      if (
        !best ||
        entry.score > best.score ||
        (entry.score === best.score && entry.len > best.len)
      ) {
        best = entry;
      }
    }

    return best ? { pattern: best.pattern, route: best.route } : null;
  }

  function isRegistered(path: string | URL) {
    return match(path) !== null;
  }

  function isProtected(path: string | URL, defaultWhenNoMatch = false) {
    const m = match(path);
    return m ? !!m.route.protected : defaultWhenNoMatch;
  }

  function resolve(path: string | URL) {
    const m = match(path);
    return m ? m.route : null;
  }

  function getNamespace(path: string | URL) {
    const r = resolve(path);
    return r?.namespace;
  }

  return { match, isRegistered, isProtected, resolve, getNamespace };
}
