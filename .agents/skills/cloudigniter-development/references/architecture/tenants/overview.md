# Tenant Request Lifecycle

Use this folder for the connected CloudIgniter request path from Next.js configuration through Tenant-aware routing, request context, localization, bootstrap, and internal endpoints.

## Reading map

- Read [routing.md](routing.md) for `next.config.ts`, the application proxy, and Tenant/route resolution.
- Read [context-and-localization.md](context-and-localization.md) for same-request and cross-request context transport plus next-intl message resolution.
- Read [bootstrap-and-diagnostics.md](bootstrap-and-diagnostics.md) for bootstrap/provider flow, proxy-excluded endpoints, ownership rules, and diagnosis.
- Read [page rendering](../rendering/page-rendering.md) when the change continues into layouts, wrappers, providers, or pages.

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
            → enforce the route's allowed Tenant scopes
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

Org Unit routing resolves a strongly consistent tenant/path attachment before route matching. The attachment carries the canonical node ID and authoritative predecessor IDs used for descendant authorization. See [Org Unit trees and tenant sharing](org-units.md).
