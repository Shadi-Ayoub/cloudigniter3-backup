import type { CiRoute, CiRoutesMap, CiMatchedRoute } from "@ci-core/types";
export type CiCompiledRoutes = {
    match: (path: string | URL) => CiMatchedRoute;
    isRegistered: (path: string | URL) => boolean;
    isProtected: (path: string | URL, defaultWhenNoMatch?: boolean) => boolean;
    resolve: (path: string | URL) => CiRoute | null;
    getNamespace: (path: string | URL) => string | undefined;
};
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
export declare function ciCompileRoutes(routes: CiRoutesMap): CiCompiledRoutes;
//# sourceMappingURL=ci-compile-routes.d.ts.map