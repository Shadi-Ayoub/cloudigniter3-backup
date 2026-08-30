# Bootstrap and Request Diagnostics

Use this reference for bootstrap/provider flow, proxy-excluded internal endpoints, lifecycle ownership, and end-to-end diagnosis.

## 7. Bootstrap and provider flow

`appBootstrap()` runs after the proxy has forwarded request context. Its configuration path may call next-intl server APIs, which invoke `request.ts`. It then obtains the request context and composes application/provider state for wrappers and components.

Root layouts, route-group layouts, and pages consume that state through different wrapper layers. Read [page rendering](../rendering/page-rendering.md) for the complete root-layout, `CiLayout`, `CiPageWrapper`, `CiClientWrapper`, and `CiPage` render hierarchy.

This means bootstrap failures can originate earlier in:

- proxy matching;
- tenant or route resolution;
- request-context serialization;
- next-intl plugin wiring;
- locale/message loading.

Do not add a second route or locale resolver inside bootstrap to mask an upstream failure. Repair the lifecycle stage that owns the missing data.

## 8. Internal endpoints

Paths excluded by the proxy, such as `ci-internal`, are separate requests and do not automatically receive the page request's forwarded context header.

Do not call page-level `appBootstrap()` from a proxy-excluded internal endpoint. Bootstrap invokes next-intl and
requires the proxy-produced request context. Resolve only the endpoint's minimal prerequisites instead—for
example, use proxy-safe core configuration and the authenticated provider session for a developer-access check.

For diagnostics that need page route context:

1. Send the current public pathname explicitly.
2. Read header and cookie candidates independently.
3. Reject malformed or unresolved candidates.
4. Require the candidate route's public or feature pathname to match the requested pathname.
5. Choose transport precedence deliberately for that endpoint.
6. Return an explicit mismatch error instead of loading messages for a stale route.

Do not generalize this diagnostic cookie strategy into authentication or authorization trust.

## 9. Ownership and change rules

| Concern                                              | Owner                                                  |
| ---------------------------------------------------- | ------------------------------------------------------ |
| Next.js plugin/build composition                     | `apps/template/next.config.ts`                         |
| Application proxy entry and matcher                  | `apps/template/src/proxy.ts`                           |
| Reusable Next.js proxy/context algorithms            | `packages/next`                                        |
| Generic request-context contracts/serialization      | `packages/core`                                        |
| Application route registry                           | manual/generated definitions under `apps/template/src/custom/routes`; thin composition in `apps/template/routes.ts` |
| Route Tenant-scope contract and public-path building | `packages/core`                                        |
| Generic namespace resolution                         | `packages/core` when runtime-neutral                   |
| Reusable Next.js i18n integration                    | `packages/next`                                        |
| Application locale registry and overrides            | `apps/template`                                        |

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

## Related references

- [Tenant request-lifecycle overview](overview.md)
- [Tenant routing](routing.md)
- [Request context and localization](context-and-localization.md)
- [Page rendering](../rendering/page-rendering.md)
