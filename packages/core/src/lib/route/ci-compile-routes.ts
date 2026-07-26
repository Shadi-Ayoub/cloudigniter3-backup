import type { CiMatchedRoute, CiRouteDefinition, CiRoutesMap } from "@ci-core/types";

import { ciNormalizePathname } from "@ci-core/lib";

type CompiledEntry = {
  pattern: string;
  route: CiRouteDefinition;
  rx: RegExp;
  score: number;
  len: number;
};

export type CiCompiledRoutes = {
  match: (path: string | URL) => CiMatchedRoute;
  isRegistered: (path: string | URL) => boolean;
  isProtected: (path: string | URL, defaultWhenNoMatch?: boolean) => boolean;

  /**
   * Returns the registered route definition.
   *
   * This is not a fully resolved CiRoute because request-specific
   * properties have not been created yet.
   */
  resolve: (path: string | URL) => CiRouteDefinition | null;

  getNamespace: (path: string | URL) => string | undefined;
};

/**
 * Escape regex special chars in literals.
 */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Convert a route pattern to a regex.
 * Supports:
 * - '/admin/*'      -> matches '/admin' and deeper paths
 * - '/users/:id'    -> matches '/users/123' (single segment)
 * - exact paths     -> matched exactly
 */
function toRegex(pattern: string): RegExp {
  const normalizedPattern = ciNormalizePathname(pattern);

  if (normalizedPattern.endsWith("/*")) {
    const base = ciNormalizePathname(normalizedPattern.slice(0, -2));

    return new RegExp(`^${escapeRegex(base)}(?:/.*)?$`);
  }

  const parts = normalizedPattern.split(/(:[^/]+)/g).filter(Boolean);

  const rebuilt = parts.map((part) => (part.startsWith(":") ? "[^/]+" : escapeRegex(part))).join("");

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
function patternScore(pattern: string): {
  score: number;
  len: number;
} {
  const normalizedPattern = ciNormalizePathname(pattern);
  const segments = normalizedPattern.split("/").filter(Boolean);

  let score = 0;

  for (const segment of segments) {
    if (segment === "*") {
      score -= 2;
    } else if (segment.startsWith(":")) {
      score += 1;
    } else {
      score += 2;
    }
  }

  if (normalizedPattern.endsWith("/*")) {
    score -= 1;
  }

  return {
    score,
    len: normalizedPattern.length,
  };
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
  const compiled: CompiledEntry[] = Object.entries(routes).map(([pattern, route]) => {
    const rx = toRegex(pattern);
    const { score, len } = patternScore(pattern);

    return {
      pattern,
      route,
      rx,
      score,
      len,
    };
  });

  function match(path: string | URL): CiMatchedRoute {
    const pathname = ciNormalizePathname(path);

    let best: CompiledEntry | null = null;

    for (const entry of compiled) {
      if (!entry.rx.test(pathname)) {
        continue;
      }

      if (!best || entry.score > best.score || (entry.score === best.score && entry.len > best.len)) {
        best = entry;
      }
    }

    return best
      ? {
          pattern: best.pattern,
          route: best.route,
        }
      : null;
  }

  function isRegistered(path: string | URL): boolean {
    return match(path) !== null;
  }

  function isProtected(path: string | URL, defaultWhenNoMatch = false): boolean {
    const matched = match(path);

    return matched ? Boolean(matched.route.protected) : defaultWhenNoMatch;
  }

  function resolve(path: string | URL): CiRouteDefinition | null {
    return match(path)?.route ?? null;
  }

  function getNamespace(path: string | URL): string | undefined {
    return resolve(path)?.namespace;
  }

  return {
    match,
    isRegistered,
    isProtected,
    resolve,
    getNamespace,
  };
}
