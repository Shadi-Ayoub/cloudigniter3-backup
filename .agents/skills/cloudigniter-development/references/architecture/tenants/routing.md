# Tenant Routing

Use this reference for Next.js configuration, proxy composition, locale normalization, Tenant and Org Unit resolution, logical route matching, redirects, and rewrites.

## 2. Role of `apps/template/next.config.ts`

`next.config.ts` is the application-level Next.js composition entry point. In the template it currently owns:

- `transpilePackages` for source-consumed CloudIgniter workspace packages;
- `turbopack.root` for the monorepo workspace boundary;
- framework options such as strict mode;
- build-exposed metadata such as the Next.js version;
- next-intl plugin registration.

The next-intl registration is executable wiring, not incidental configuration:

```ts
const withNextIntl = createNextIntlPlugin(
  "./src/kernel/server/i18n/request.ts",
);

export default withNextIntl(nextConfig);
```

This tells next-intl which request configuration to execute when server APIs such as `getLocale()`, `getMessages()`, or `getTranslations()` need locale data. Application code does not need to import `request.ts` directly.

Rules:

- Inspect `next.config.ts` before changing i18n request configuration or assuming `request.ts` is unused.
- Preserve plugin composition when adding another Next.js wrapper; each wrapper must receive and return the complete config.
- Keep build/plugin composition here, not tenant, authorization, message-merging, or request-context algorithms.
- Keep application-specific plugin paths and workspace settings in the template.
- Put reusable Next.js helpers invoked by the configured entry points in `packages/next`.
- Validate both configuration loading and the downstream runtime consumer after changing this file.

## 3. Role of `apps/template/src/proxy.ts`

`proxy.ts` is the application request entry point. It should remain thin:

1. Resolve proxy-safe application configuration without request-scoped APIs.
2. Obtain the application route registry.
3. Delegate reusable Next.js processing to `ciNextProxyResponse()` from `@cloudigniter/next/server/proxy`.
4. Export the matcher that defines which requests participate in CloudIgniter routing.

The matcher is part of application behavior. In the template, static assets, framework internals, APIs, and `ci-internal` endpoints bypass the proxy. Any consumer behind an excluded path must not assume it receives the same proxy-injected request header as an application page.

Rules:

- Keep reusable tenant/route/context logic in `packages/next`, not in `proxy.ts`.
- Use only proxy-safe configuration; do not call `headers()`, `cookies()`, `getLocale()`, or `getMessages()` while building proxy configuration.
- Review matcher changes against i18n, bootstrapping, authentication, internal endpoints, and diagnostics.
- Do not trust an incoming client-supplied context header. Remove it before injecting authoritative proxy output.

## 4. Tenant and route resolution strategy

The order is intentional:

```text
public pathname
    → normalize
    → resolve tenant
    → resolve org unit
    → derive featurePathname
    → match featurePathname against application routes
    → make route/access decision
    → construct resolved request context
```

Route matching must use the logical `featurePathname`, not tenant/org-unit transport segments from the public URL.

The proxy may construct an unresolved context with `route: null` after tenant resolution. That context is valid only for branches that intentionally stop before a registered route is available, such as tenant/org-unit information pages or unregistered-route handling.

For a normal registered application request:

- route resolution must complete before constructing the resolved context;
- when `CiRouteDefinition.tenantScopes` is present, the resolved Tenant scope must be included before authentication or page rendering continues;
- omitting `tenantScopes` preserves compatibility and allows the route in system, global, and tenant scopes;
- the resolved route must include only request-specific route information;
- the route registry must remain in application configuration and must never be copied into request context;
- a registered page reaching i18n with `route: null` indicates a lifecycle defect.

Redirects and rewrites differ:

- a rewrite can forward modified headers within the same request;
- a redirect creates a new browser request and cannot forward the current request's injected headers;
- cross-request state needed after a redirect must use an appropriate transport and be revalidated.

Scope-specific pages use stable internal route roots while route registration
continues to use the logical feature pathname:

```text
/t/global/dashboard/books → /ci-global/dashboard/books
/t/acme/dashboard/books   → /ci-tenant/dashboard/books
routes.ts key              → /dashboard/books
```

The parenthesized App Router groups `(ci-global)` and `(ci-tenant)` do not add
URL segments. Their nested `ci-global` and `ci-tenant` directories are required
because they are the targets of the proxy rewrite. Use
`ciBuildTenantPublicPathname()` when application UI needs a browser-visible
pathname for a logical feature route; do not link to either internal prefix.

## Related references

- [Tenant request-lifecycle overview](overview.md)
- [Request context and localization](context-and-localization.md)
- [Bootstrap and diagnostics](bootstrap-and-diagnostics.md)
