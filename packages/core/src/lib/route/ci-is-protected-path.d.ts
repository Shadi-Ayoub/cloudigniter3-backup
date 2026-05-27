import type { CiRoutesMap } from "@ci-core/types";
/**
 * True if the matched route is protected.
 * If nothing matches, returns defaultWhenNoMatch (default false).
 */
export declare function ciIsProtectedPath(path: string | URL, routes: CiRoutesMap, defaultWhenNoMatch?: boolean): boolean;
//# sourceMappingURL=ci-is-protected-path.d.ts.map