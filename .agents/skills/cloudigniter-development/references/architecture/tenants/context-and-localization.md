# Request Context and Localization

Use this reference for authoritative request-context creation, header and cookie transport, pathname correlation, next-intl request configuration, and route-scoped message loading.

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

## Related references

- [Tenant request-lifecycle overview](overview.md)
- [Tenant routing](routing.md)
- [Bootstrap and diagnostics](bootstrap-and-diagnostics.md)
- [Page rendering](../rendering/page-rendering.md)
