# Application Request Lifecycle

Use this reference whenever work touches or depends on `next.config.ts`, `proxy.ts`, tenant/org-unit routing, route resolution, request context, rewrites/redirects, bootstrapping, next-intl, or locale messages.

## Table of contents

1. Lifecycle overview
2. `next.config.ts`
3. `apps/template/src/proxy.ts`
4. Tenant and route resolution strategy
5. Request-context transport
6. i18n and message resolution
7. Bootstrap and provider flow
8. Internal endpoints
9. Ownership and change rules
10. Diagnostic sequence

## 1. Lifecycle overview

Treat these files as one execution chain even though Next.js invokes them at different phases:

```text
Next.js build/startup
    apps/template/next.config.ts
        registers next-intl request configuration
        configures monorepo package transpilation and Turbopack root

Incoming application request
    apps/template/src/proxy.ts matcher
        → appGetCoreConfig()
        → @cloudigniter/next ciNextProxyResponse()
            → normalize public pathname
            → resolve tenant and org unit
            → derive logical feature pathname
            → resolve registered route
            → enforce route/auth redirect decisions
            → build minimal CiRequestContext
            → inject same-request header
            → persist cookie when cross-request transport is needed
            → rewrite tenant-aware URL to feature route

Server rendering / next-intl
    apps/template/src/kernel/server/i18n/request.ts
        → resolve locale
        → read proxy-generated request-context header
        → read resolved route namespace/pathname
        → ciLoadRouteMessages()
        → return locale + messages to next-intl

Application bootstrap
    getLocale()/getMessages()
        → next-intl request configuration above
    ciGetRequestContext()
        → proxy-generated request context
    wrappers/providers/components
        → client translations and application context
```

A change at an earlier stage can surface as a failure much later. For example, an incorrect proxy matcher can appear as a next-intl missing-message error because `request.ts` never receives a resolved route namespace.

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
  "./src/kernel/server/i18n/request.ts"
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
- the resolved route must include only request-specific route information;
- the route registry must remain in application configuration and must never be copied into request context;
- a registered page reaching i18n with `route: null` indicates a lifecycle defect.

Redirects and rewrites differ:

- a rewrite can forward modified headers within the same request;
- a redirect creates a new browser request and cannot forward the current request's injected headers;
- cross-request state needed after a redirect must use an appropriate transport and be revalidated.

## 5. Request-context transport

`CiRequestContext` is a minimal snapshot of the current request, typically containing:

- schema version;
- resolved tenant;
- resolved org unit;
- logical feature pathname;
- resolved route, or `null` only for intentional unresolved branches.

Do not serialize:

- the complete route registry;
- the complete application configuration;
- message catalogs;
- provider clients or provider secrets;
- large diagnostics;
- data that can be obtained from an existing server-side source.

Transport semantics:

| Transport      | Purpose                                                    | Lifetime                                                |
| -------------- | ---------------------------------------------------------- | ------------------------------------------------------- |
| Request header | Authoritative proxy-to-server context for the same request | Current request only                                    |
| Cookie         | Bridge for redirects or separate browser/internal requests | Later requests; potentially stale and client-controlled |

Consequences:

- Server rendering for a proxied application page should prefer the proxy-generated header.
- An internal browser fetch does not inherit a server-side forwarded header from the page request.
- A cookie-derived context must be deserialized, validated, and correlated with an authoritative pathname before use.
- Cookie context must not be treated as authorization evidence without authoritative server validation.
- Keep serialized cookies comfortably below browser limits and replace stale schema versions deliberately.

## 6. i18n and message resolution

The i18n request file is registered by `next.config.ts` and executed by next-intl on demand:

```text
getLocale()/getMessages()/getTranslations()
    → next-intl plugin
    → apps/template/src/kernel/server/i18n/request.ts
```

`request.ts` performs these steps:

1. Resolve the locale using application i18n configuration.
2. Read the configured request-context header created by the proxy.
3. Deserialize and validate the context.
4. Require a resolved route for a normal application page.
5. Pass `route.namespace` and `route.pathname` to the message loader.
6. Return only next-intl-supported request configuration such as `locale` and `messages`.

The message loader derives a file chain from the route namespace. For example:

```text
namespace: dashboard.theme
files:     common, dashboard, dashboard-theme
```

The application loader currently merges in this precedence:

1. core `common`;
2. core namespace chain;
3. custom `common`;
4. custom namespace chain.

Application messages therefore override core messages at the same key.

Important distinction:

> A key existing in a locale JSON file does not mean it exists in the active next-intl message bundle.

The active bundle depends on the locale registry, resolved route namespace, requested file chain, merge result, and provider wiring. Diagnose `MISSING_MESSAGE` across that chain.

Rules:

- Keep route namespace authoritative; do not re-resolve a different route inside the normal i18n request hook.
- Keep `request.ts` server-only in behavior and free of client imports.
- Keep application locale overrides in the template; place reusable namespace/message helpers in the appropriate package.
- When relocating `request.ts`, update the path in `next.config.ts` in the same change.
- When changing a route namespace, update and validate the corresponding locale registry/files.

## 7. Bootstrap and provider flow

`appBootstrap()` runs after the proxy has forwarded request context. Its configuration path may call next-intl server APIs, which invoke `request.ts`. It then obtains the request context and composes application/provider state for wrappers and components.

Root layouts, route-group layouts, and pages consume that state through different wrapper layers. Read [page-rendering.md](page-rendering.md) for the complete root-layout, `CiLayout`, `CiPageWrapper`, `CiClientWrapper`, and `CiPage` render hierarchy.

This means bootstrap failures can originate earlier in:

- proxy matching;
- tenant or route resolution;
- request-context serialization;
- next-intl plugin wiring;
- locale/message loading.

Do not add a second route or locale resolver inside bootstrap to mask an upstream failure. Repair the lifecycle stage that owns the missing data.

## 8. Internal endpoints

Paths excluded by the proxy, such as `ci-internal`, are separate requests and do not automatically receive the page request's forwarded context header.

For diagnostics that need page route context:

1. Send the current public pathname explicitly.
2. Read header and cookie candidates independently.
3. Reject malformed or unresolved candidates.
4. Require the candidate route's public or feature pathname to match the requested pathname.
5. Choose transport precedence deliberately for that endpoint.
6. Return an explicit mismatch error instead of loading messages for a stale route.

Do not generalize this diagnostic cookie strategy into authentication or authorization trust.

## 9. Ownership and change rules

| Concern                                         | Owner                                                  |
| ----------------------------------------------- | ------------------------------------------------------ |
| Next.js plugin/build composition                | `apps/template/next.config.ts`                         |
| Application proxy entry and matcher             | `apps/template/src/proxy.ts`                           |
| Reusable Next.js proxy/context algorithms       | `packages/next`                                        |
| Generic request-context contracts/serialization | `packages/core`                                        |
| Application route registry                      | `apps/template/routes.ts` or application configuration |
| Generic namespace resolution                    | `packages/core` when runtime-neutral                   |
| Reusable Next.js i18n integration               | `packages/next`                                        |
| Application locale registry and overrides       | `apps/template`                                        |

When a task starts in a template entry point, retain only application selection/configuration there and extract reusable logic to its owner.

## 10. Diagnostic sequence

When context or translations fail, inspect in this order:

1. Confirm `next.config.ts` registers the intended i18n request file.
2. Confirm the failing URL matches or intentionally bypasses `proxy.ts`.
3. Inspect the exact failing HTTP request, not only the parent page request.
4. Confirm tenant/org-unit resolution produced the expected feature pathname.
5. Confirm route matching produced the expected pattern and namespace.
6. Confirm the resolved context is minimal and the same-request header was injected.
7. For redirects/internal fetches, inspect the later request's cookie/header separately.
8. Confirm `request.ts` read the configured header name and a non-null route.
9. Confirm namespace-to-file expansion.
10. Confirm the locale registry includes those files and custom overrides have the intended precedence.
11. Confirm the resulting messages object passed to next-intl contains the key.

Do not stop after verifying that a cookie exists or a JSON file contains a key; neither proves that the failing request selected that context or loaded that file.
