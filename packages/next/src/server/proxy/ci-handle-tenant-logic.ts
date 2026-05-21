import { NextRequest, NextResponse } from "next/server";

import {
  CI_DEFAULT_TENANT_COOKIES,
  CI_DEFAULT_TENANT_HEADERS,
} from "@cloudigniter/core";

import type {
  CiCoreConfig,
  CiTenantResolutionOptions,
  CiTenantRoutingOptions,
  CiTenantStatus,
} from "@cloudigniter/core/types";

import {
  CI_DEFAULT_TENANT_ROUTING_OPTIONS,
  ciGetHost,
  ciLookupTenant,
  ciResolveTenant,
  ciRewriteToTenantInfoPage,
} from "./helpers";

interface handleTenantLogicInterface {
  request: NextRequest;
  response: NextResponse;
  pathnameNormalized: string;
  ciConfig: CiCoreConfig;
}

/**
 * Proxy tenant handler that:
 *  - resolves tenant context (tenantId + scope) from path/headers/subdomain
 *  - writes tenant/scope metadata to response headers (and optionally cookies)
 *  - optionally validates the tenant via an internal lookup endpoint
 *  - rewrites/redirects to canonical info pages when tenant is missing or suspended
 *
 * What it does
 * ------------
 * This function is designed to be called from Next.js proxy as the
 * “tenant resolution + tenant validation” stage. It returns:
 *
 *   { tenant, response, exit }
 *
 * where `exit=true` means the proxy pipeline must stop because an
 * info-page rewrite/redirect has already been produced.
 *
 * Responsibilities
 * ----------------
 * 1) Merge routing configuration
 *    - Builds a fully-resolved CiTenantRoutingOptions object (`tOpts`) by merging:
 *
 *        defaultTenantRoutingOptions + (ciConfig.tenant overrides)
 *
 *    - This guarantees safe defaults, and ensures downstream code can rely on
 *      `Required<CiTenantRoutingOptions>` semantics (no undefined option branches).
 *
 * 2) Resolve tenant context
 *    - Calls resolveTenant() using:
 *        • pathnameNormalized (path-mode routing)
 *        • tenant header (if previously prepared by upstream proxy or reverse proxy)
 *        • host (subdomain-mode routing)
 *
 *    - Produces a tenant resolution object that includes:
 *        • scope: "system" | "global" | "tenant"
 *        • tenantId (when scope === "tenant")
 *
 *    - Writes the scope to a dedicated response header:
 *
 *        response.headers.set(tOpts.scopeHeaderName, tenant.scope)
 *
 * 3) Write tenant metadata to headers/cookies
 *    - If resolved scope is tenant:
 *        • Sets tenant header:   tOpts.tenantHeaderName = tenantId
 *        • Optionally writes a tenant cookie when tOpts.writeTenantCookie is true
 *
 *    - If scope is not tenant:
 *        • Deletes tenant header
 *        • Deletes tenant status header
 *
 *    Rationale:
 *    - Downstream server components and route handlers can rely on these headers/cookies
 *      to infer tenant context without re-resolving it.
 *
 * 4) Optional tenant validation (existence + status)
 *    - Executed only when ALL of the following hold:
 *        • tOpts.validateTenant === true
 *        • tenant.scope === "tenant"
 *        • request is not already on the info pages (not found / suspended)
 *
 *    - Performs validation through lookupTenant(), which calls an internal Node endpoint
 *      (must be excluded from proxy to avoid recursion).
 *
 * 5) Handle invalid tenant (not found)
 *    - If lookupTenant returns exists=false:
 *        • Clears the tenant cookie to avoid “sticky” invalid tenant state
 *        • Navigates to tOpts.tenantNotFoundPath via rewriteToInfoPage()
 *        • Stops the pipeline (exit=true)
 *
 * 6) Handle suspended tenant
 *    - If lookupTenant returns status === "suspended":
 *        • Writes tenant status header
 *        • Navigates to tOpts.tenantSuspendedPath via rewriteToInfoPage()
 *        • Stops the pipeline (exit=true)
 *
 * CiTenant scope semantics
 * ----------------------
 * This function assumes CloudIgniter’s scope model:
 *
 *   - "system": request is not under the tenant base path / mode (no tenant context)
 *   - "global": request targets the global tenant sentinel (e.g., /t/(global))
 *   - "tenant": request resolves to a specific tenantId (e.g., /t/school-a)
 *
 * (The scope itself is produced by resolveTenant(); this function only persists it.)
 *
 * Info page navigation strategy
 * -----------------------------
 * Info-page navigation is delegated to rewriteToInfoPage(), which:
 *  - clears the query string
 *  - injects canonical params: ?tenant=<id>&scope=<scope>
 *  - applies the configured strategy: rewrite (default) or redirect
 *
 * This function does not decide “how” navigation occurs; it respects tOpts.
 *
 * Inputs
 * ------
 * request:
 *   The NextRequest being processed by proxy.
 *
 * response:
 *   A mutable NextResponse (often NextResponse.next()) used to accumulate headers/cookies.
 *
 * pathnameNormalized:
 *   Normalized request pathname (recommended: output of normalizePathname()).
 *   Used for resolution and for excluding info-page recursion.
 *
 * ciConfig:
 *   CloudIgniter runtime configuration. CiTenant-related options are read from ciConfig.tenant.
 *
 * Outputs
 * -------
 * { tenant, response, exit }
 *
 * tenant:
 *   The resolved tenant context returned by resolveTenant(). May be undefined if disabled
 *   or if resolution fails conservatively.
 *
 * response:
 *   - The same response passed in (with tenant/scope headers/cookies applied), OR
 *   - a rewrite/redirect response to a tenant info page.
 *
 * exit:
 *   - false  → caller should continue proxy processing and eventually return `response`
 *   - true → caller must stop and return the provided rewrite/redirect response immediately
 *
 * Failure behavior
 * ----------------
 * CiTenant validation is fail-safe:
 * - If lookupTenant fails or returns a non-OK result, it is treated as not found (exists=false),
 *   which routes to the not-found info page when validateTenant is enabled.
 *
 * Operational notes
 * -----------------
 * - Ensure tOpts.tenantLookupPath and info-page paths are excluded from proxy guards
 *   where appropriate to prevent rewrite loops.
 * - If writeTenantCookie is enabled, clearing is performed on not-found outcomes to avoid
 *   persisting invalid tenant selection in the browser.
 */
export async function ciHandleTenantLogic({
  request,
  response,
  pathnameNormalized,
  ciConfig,
}: handleTenantLogicInterface) {
  let exit: boolean = false;

  // Merge tenant routing options (safe defaults first)
  const tOpts = {
    ...CI_DEFAULT_TENANT_ROUTING_OPTIONS,
    ...(ciConfig?.tenant ?? {}),
  } as Required<CiTenantRoutingOptions>;

  const tenantResolveOptions: CiTenantResolutionOptions = {
    enabled: tOpts.enabled,
    scopeHeaderName: tOpts.scopeHeaderName,
    tenantRoutingMode: tOpts.mode,
    tenantHeaderKey: tOpts.idHeaderName,
    tenantBasePath: tOpts.basePath,
    rewriteSubdomainToTenantPath: tOpts.rewriteSubdomainToTenantPath,
    baseDomain: tOpts.rootDomains,
  };

  const tenant = ciResolveTenant(
    {
      pathnameNormalized,
      // headers: {
      //   [tOpts.tenantHeaderName]: request.headers.get(tOpts.tenantHeaderName) ?? undefined,
      // },
      mode: tOpts.mode,
      host: tOpts.mode === "subdomain" ? ciGetHost(request) : undefined,
      // bypass,
    },
    tenantResolveOptions,
  );

  // Set headers
  const tenantIdHeaderName: string =
    tOpts.idHeaderName ?? CI_DEFAULT_TENANT_HEADERS.tenantId;
  const tenantModeHeaderName: string =
    tOpts.modeHeaderName ?? CI_DEFAULT_TENANT_HEADERS.tenantMode;
  const tenantScopeHeaderName: string =
    tOpts.scopeHeaderName ?? CI_DEFAULT_TENANT_HEADERS.tenantMode;
  const tenantStatusHeaderName: string =
    tOpts.statusHeaderName ?? CI_DEFAULT_TENANT_HEADERS.tenantStatus;
  response.headers.set(tenantIdHeaderName, tenant.id ?? "");
  response.headers.set(tenantScopeHeaderName, tenant.scope);
  response.headers.set(tenantStatusHeaderName, tenant.status ?? "");
  response.headers.set(tenantModeHeaderName, tOpts.mode);

  // Set Cookies
  const tenantIdCookieName: string =
    tOpts.idCookieName ?? CI_DEFAULT_TENANT_COOKIES.tenantId;
  const tenantModeCookieName: string =
    tOpts.modeCookieName ?? CI_DEFAULT_TENANT_COOKIES.tenantMode;
  const tenantScopeCookieName: string =
    tOpts.scopeCookieName ?? CI_DEFAULT_TENANT_COOKIES.tenantMode;
  const tenantStatusCookieName: string =
    tOpts.statusCookieName ?? CI_DEFAULT_TENANT_COOKIES.tenantStatus;
  response.cookies.set(tenantIdCookieName, tenant.id ?? "", {
    path: "/",
    sameSite: "lax",
  });
  response.cookies.set(tenantScopeCookieName, tenant.scope, {
    path: "/",
    sameSite: "lax",
  });
  response.cookies.set(tenantStatusCookieName, tenant.status ?? "", {
    path: "/",
    sameSite: "lax",
  });
  response.cookies.set(tenantModeCookieName, tOpts.mode, {
    path: "/",
    sameSite: "lax",
  });

  // --------------------------------------------------------------------
  // CiTenant validation step
  //
  // CiTenant is resolved from the URL but it may not be valid/registered
  // or suspended.
  // --------------------------------------------------------------------
  if (
    tOpts.validateTenant &&
    // !bypass &&
    tenant &&
    tenant.scope === "tenant" &&
    // Don’t validate when the request is already going to “not found” / “suspended” pages
    pathnameNormalized !== tOpts.notFoundPath &&
    pathnameNormalized !== tOpts.suspendedPath
  ) {
    const info = await ciLookupTenant(request, tenant.id ?? "", tOpts);
    // throw Error(JSON.stringify(info));
    if (!info.exists) {
      // Clear tenant cookie to avoid sticky invalid tenant
      response.cookies.set(tenantIdCookieName, "", {
        path: "/",
        sameSite: "lax",
        maxAge: 0,
      });

      const r = ciRewriteToTenantInfoPage(
        request,
        tOpts.notFoundPath,
        tenant.id ?? "",
        tenant.scope,
        tOpts,
        response,
      );

      return { tenant, response: r, exit: true };
    }

    const status: CiTenantStatus = info.status ?? "active";
    response.headers.set(tOpts.statusHeaderName, status);

    if (status === "suspended") {
      const r = ciRewriteToTenantInfoPage(
        request,
        tOpts.suspendedPath,
        tenant.id ?? "",
        tenant.scope,
        tOpts,
        response,
      );

      return { tenant: { ...tenant, status }, response: r, exit: true };
    }
  }

  return { tenant, response, exit };
}
