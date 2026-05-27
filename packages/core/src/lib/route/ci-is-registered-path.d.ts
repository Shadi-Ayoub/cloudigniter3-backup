import type { CiRoutesMap, CiRoute } from "@ci-core/types";
/**
 * Returns true if the given path matches any registered route pattern.
 * - Handles exact paths, `/*` wildcards, and `:param` segments.
 * - Ignores query strings and hash fragments.
 */
export declare function ciIsRegisteredPath(path: string | URL, registeredRoutes: CiRoutesMap | Record<string, CiRoute>): boolean;
//# sourceMappingURL=ci-is-registered-path.d.ts.map