/**
 * Canonicalizes a pathname into a stable, comparable form.
 *
 * Normalization pipeline:
 * 1) Accepts `string | URL | null | undefined`
 * 2) Extracts pathname (strips query string and hash if present)
 * 3) Trims whitespace
 * 4) Ensures a leading slash
 * 5) Collapses duplicate slashes (`//` → `/`)
 * 6) Removes trailing slash (except root)
 * 7) Optionally lowercases the result (disabled by default)
 *
 * Why this exists:
 * Pathnames originating from browsers, rewrites, reverse proxies,
 * or user-generated links are not guaranteed to be structurally consistent.
 * Canonicalization prevents subtle bugs in:
 *
 * • Middleware route matching
 * • Authorization / RBAC policy checks
 * • Cache keys
 * • Navigation guards
 *
 * Important notes:
 * - Query strings and hash fragments are removed automatically.
 * - Root path is always normalized to "/".
 * - Lowercasing is opt-in because some systems treat paths as case-sensitive.
 *
 * Examples:
 * - undefined                → "/"
 * - ""                       → "/"
 * - "dashboard"              → "/dashboard"
 * - "/dashboard//tenants/"   → "/dashboard/tenants"
 * - "/dashboard?a=1#test"    → "/dashboard"
 * - new URL("https://x/a/")  → "/a"
 * - "/Dashboard/Tenants/"    → "/dashboard/tenants" (with lowercase: true)
 *
 * @param input   - Raw pathname, URL, or nullable value.
 * @param options - Normalization controls.
 * @returns Stable canonical pathname.
 */
export declare function ciNormalizePath(input?: string | URL | null, options?: {
    lowercase?: boolean;
}): string;
//# sourceMappingURL=ci-normalize-path.d.ts.map