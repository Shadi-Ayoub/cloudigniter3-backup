import assert from "node:assert/strict";
import test from "node:test";
import type { CiTenantResolutionOptions } from "@cloudigniter/core/types";
import { ciResolveSlugTenant } from "../../src/server/tenant/helpers/ci-resolve-slug-tenant";
import { ciResolveSubdomainTenant } from "../../src/server/tenant/helpers/ci-resolve-subdomain-tenant";
import { ciNormalizeRootDomains } from "../../src/server/tenant/helpers/ci-normalize-root-domains";
import { ciNormalizeTenantStatus } from "../../src/server/tenant/helpers/ci-normalize-tenant-status";
import { ciNormalizeTenantScope } from "../../src/server/tenant/helpers/ci-normalize-tenant-scope";
import { ciGetBypassFlag } from "../../src/server/proxy/helpers/ci-get-bypass-flag";
import { ciIsExternalHref } from "../../src/lib/navigation/ci-is-external-href";
import { ciResolveAuthProvider } from "../../src/lib/auth/ci-resolve-auth-provider";

const options: CiTenantResolutionOptions = {
  enabled: true, tenantRoutingMode: "slug", tenantBasePath: "/t",
  baseDomain: ["https://example.com", "http://localhost:3000/"],
  rewriteSubdomainToTenantPath: true,
};
for (const [pathname, scope, feature, slug] of [
  ["/dashboard", "system", "/dashboard", undefined],
  ["/t", "system", "/t", undefined],
  ["/team/acme", "system", "/team/acme", undefined],
  ["/t/global/dashboard", "global", "/dashboard", undefined],
  ["/t/acme/dashboard", "tenant", "/dashboard", "acme"],
  ["/t/acme", "tenant", "/", "acme"],
] as const) {
  test(`slug routing isolates ${pathname}`, () => {
    const result = ciResolveSlugTenant(pathname, options);
    assert.equal(result.scope, scope);
    assert.equal(result.featurePathname, feature);
    assert.equal(result.slug, slug);
  });
}
for (const [host, scope, slug] of [
  ["", "system", undefined], ["example.com", "system", undefined],
  ["evil-example.com", "system", undefined], ["example.com.evil.test", "system", undefined],
  ["acme.example.com:443", "tenant", "acme"], [" ACME.EXAMPLE.COM ", "tenant", "acme"],
  ["global.example.com", "global", undefined], ["acme.localhost:3000", "tenant", "acme"],
] as const) {
  test(`subdomain routing confines ${host || "empty host"} to configured roots`, () => {
    const result = ciResolveSubdomainTenant(host, "/dashboard", options);
    assert.equal(result.scope, scope);
    assert.equal(result.slug, slug);
    assert.equal(result.featurePathname, "/dashboard");
  });
}
test("configured roots normalize scheme, port and case and omit empty entries", () => {
  assert.deepEqual(ciNormalizeRootDomains(["", "https://EXAMPLE.com/", "localhost:3000"]), ["example.com", "localhost"]);
});
test("tenant scope and status retain their defined fallback contracts", () => {
  for (const value of [undefined, null, "unknown", "system"]) assert.equal(ciNormalizeTenantScope(value), "system");
  for (const value of ["tenant", "global"] as const) assert.equal(ciNormalizeTenantScope(value), value);
  for (const value of [undefined, null, "unknown", "active"]) assert.equal(ciNormalizeTenantStatus(value), "active");
  for (const value of ["suspended", "archived"] as const) assert.equal(ciNormalizeTenantStatus(value), value);
});
for (const pathname of ["/_next/static/app.js", "/_vercel/insights", "/api/users", "/trpc/query", "/ci-internal/auth/session", "/favicon.ico", "/robots.txt", "/sitemap.xml", "/image.PNG", "/fonts/app.woff2", "/data.json"]) {
  test(`infrastructure bypass prevents recursive routing for ${pathname}`, () => assert.equal(ciGetBypassFlag(pathname), true));
}
for (const pathname of ["/dashboard", "/t/acme/settings", "/reports.csv/export", "/files.js/details"]) {
  test(`application path ${pathname} still reaches the proxy`, () => assert.equal(ciGetBypassFlag(pathname), false));
}
test("navigation distinguishes supported external protocols from application links", () => {
  for (const href of ["https://example.com", "http://localhost", "mailto:user@example.com", "tel:+123"]) assert.equal(ciIsExternalHref(href), true);
  for (const href of ["/dashboard", "#section", ""]) assert.equal(ciIsExternalHref(href), false);
  assert.equal(ciResolveAuthProvider(), "aws");
  assert.equal(ciResolveAuthProvider("aws"), "aws");
});
