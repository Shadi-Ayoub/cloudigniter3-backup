import { CI_DEFAULT_GLOBAL_SEGMENT } from "@cloudigniter/core";
import type { CiTenantSlugResult } from "@cloudigniter/core/types";

/**
 * Resolves tenant context from a slug-based pathname namespace.
 *
 * Expected structure:
 *   {base}/{tenantId}/...
 *
 * Example (base = "/t"):
 *   "/t/schoolA/dashboard" → tenantId = "schoolA"
 *
 * Resolution rules:
 * - If pathname does not begin with the base namespace → undefined
 * - If tenant segment is missing → undefined
 * - Otherwise → returns tenant-scoped resolution
 *
 * Scope semantics:
 * - A successfully matched slug path is ALWAYS tenant-scoped
 * - Scope is returned explicitly to avoid duplicated inference logic
 *   in proxy and authorization layers
 *
 * Path normalization:
 * - Assumes `pathname` and `base` are already canonical
 * - Does not modify slashes beyond structural extraction
 *
 * Returned pathnameWithoutTenant:
 * - Represents the logical application route with tenant prefix removed
 * - Always begins with "/"
 * - Root-safe (never empty)
 *
 * Examples:
 * - "/t/a"              → undefined (no logical route segment)
 * - "/t/a/"             → "/"
 * - "/t/a/dashboard"    → "/dashboard"
 *
 * Slug namespace resolver for paths under:
 *   {tenantBasePath}/{tenantId}/...
 *   {tenantBasePath}/(global)/...
 *
 * IMPORTANT:
 * - If pathname is NOT under tenantBasePath, return undefined (caller will treat as "system").
 * - If base is invalid ("" or "/"), return undefined to avoid matching everything.
 *
 * @param pathname - Canonical pathname (recommended: normalizePathname()).
 * @param base     - Canonical tenant base path (e.g. "/t").
 * @returns CiTenant resolution result or undefined if not a slug path.
 */

export function ciResolveTenantFromSlugPath(
  pathname: string,
  base: string,
): CiTenantSlugResult | undefined {
  const hit = findTenantBaseOccurrence(pathname, base);

  // No CiTenant Base (/t is not in the pathname!)
  if (!hit) return undefined;

  const { afterBase } = hit;

  // Exact base: ".../t" → global root
  if (!afterBase) {
    return { scope: "global" };
  }

  const segs = afterBase.split("/").filter(Boolean);
  const [seg, ...tail] = segs;

  if (!seg) {
    return { scope: "global" };
  }

  const logical = "/" + tail.join("/");
  const pathnameWithoutTenant = logical === "/" ? "/" : logical;

  if (seg === CI_DEFAULT_GLOBAL_SEGMENT) {
    return { scope: "global" };
  }

  return { scope: "tenant", tenantId: seg, pathnameWithoutTenant };
}

function stripTrailingSlash(p: string) {
  return p !== "/" && p.endsWith("/") ? p.slice(0, -1) : p;
}

/**
 * Finds the last occurrence of "/t" as a full path segment and returns:
 * - basePrefix: everything before "/t" ("" or "/dashboard")
 * - afterBase: everything after "/t" ("" or "/tenant/..." etc.)
 *
 * This is safer than naive endsWith/equality checks.
 */
function findTenantBaseOccurrence(pathname: string, tenantBasePath: string) {
  const path = stripTrailingSlash(pathname);
  const base = stripTrailingSlash(tenantBasePath);

  // Safety: base must be a real absolute segment like "/t"
  if (!base || base === "/" || !base.startsWith("/")) return undefined;

  // We only support single-segment base like "/t" here.
  // (If you ever allow "/tenant", still single segment.)
  const baseSeg = base.slice(1); // "t"
  if (!baseSeg || baseSeg.includes("/")) return undefined;

  const parts = path.split("/").filter(Boolean); // ["dashboard","t",...]
  if (!parts.length) return undefined;

  // Find the LAST index of the base segment (supports nested + avoids earlier matches)
  let idx = -1;
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i] === baseSeg) {
      idx = i;
      break;
    }
  }

  if (idx === -1) return undefined;

  const prefixParts = parts.slice(0, idx); // before "t"
  const afterParts = parts.slice(idx + 1); // after "t"

  const basePrefix = "/" + prefixParts.join("/"); // "/" or "/dashboard"
  const afterBase = afterParts.join("/"); // "" or "schoolA/users"

  return { basePrefix: basePrefix === "/" ? "" : basePrefix, afterBase };
}
