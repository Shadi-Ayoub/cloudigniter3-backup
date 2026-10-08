# Page Rendering and Layout Architecture

Use this reference for the root layout, route-group layouts, pages, bootstrap helpers, rendering wrappers, and provider placement.

## Table of contents

1. Rendering model
2. Bootstrapping contract
3. Root layout layer
4. Route layout layer
5. Page layer
6. Provider hierarchy
7. Server and client boundaries
8. Hydration-stable output
9. Change rules
10. Diagnostic sequence
11. Source map

## 1. Rendering model

Treat CloudIgniter page rendering as three nested layers that share one resolved system context:

```text
root layout
    appResolveRootLayoutContext()
        -> appBootstrap()
        -> <html> and <body> props
        -> AppRootWrapper -> CiNextRootWrapper

route layout, or the root page when it composes its own layout
    appBootstrap()
        -> CiLayout
        -> CiPageWrapper
        -> CiClientWrapper
        -> header/container/footer layout structure

route page
    appBootstrap()
        -> CiPage
        -> page shell, scrolling, breadcrumbs/header, loader, page messages
        -> page content
```

Bootstrapping resolves data; wrappers consume that data and install behavior. Keep these responsibilities separate.

The root page at `apps/templates/cloudigniter-next-aws-v1/src/app/page.tsx` composes both `CiLayout` and `CiPage` because it has no route-group layout supplying the internal skeleton. Pages beneath a route-group layout normally render only `CiPage` and their content.

## 2. Bootstrapping contract

`apps/templates/cloudigniter-next-aws-v1/src/kernel/server/bootstrap/app-bootstrap.ts` exports the cached server function `appBootstrap()`. It resolves `CiNextContext`, including:

- resolved application and Next.js configuration;
- proxy-produced request context: tenant, org unit, logical feature pathname, and route;
- settings;
- authenticated user and resolved roles;
- environment mode;
- request headers and cookies;
- provider/system status.

Call `appBootstrap()` from server route layouts and server page components before rendering CloudIgniter wrappers. Pass the resolved context down; do not reconstruct partial variants in layouts or pages.

The root-layout helper also calls `appBootstrap()`. React `cache()` allows callers participating in the same server render to share the resolved result instead of independently rebuilding system context.

Bootstrap depends on the upstream proxy, request-context, and next-intl lifecycle described in the [Tenant request-lifecycle overview](../tenants/overview.md). Do not add route or locale fallback resolution to a rendering wrapper to conceal missing bootstrap data.

## 3. Root layout layer

`apps/templates/cloudigniter-next-aws-v1/src/app/layout.tsx` calls `appResolveRootLayoutContext()` before emitting the document shell.

`apps/templates/cloudigniter-next-aws-v1/src/kernel/server/root/appResolveRootLayoutContext.ts`:

1. Calls `appBootstrap()`.
2. Derives `htmlProps`, including locale, direction, and hydration behavior.
3. Derives `bodyProps`, including the application body and font classes.
4. Retains the resolved `CiNextContext` as `ctx`.
5. Builds root debug-probe configuration.

The root layout applies `htmlProps` to `<html>`, applies `bodyProps` to `<body>`, and passes the root context to `AppRootWrapper`.

`AppRootWrapper` is the application composition adapter. It delegates reusable Next.js behavior to `CiNextRootWrapper` and inserts the application `Kernel` beside route children.

`CiNextRootWrapper` owns the reusable root behavior:

- installs the root `NextIntlClientProvider` with the resolved locale and route messages;
- conditionally renders `CiDevBeacon` after the shared development-mode, authenticated-actor, and exact-role check;
- renders the root `CiDebugProbe` only after that same shared developer-tools check;
- exposes those capabilities to all descendant layouts and pages.

Keep application-specific root composition in `AppRootWrapper`; keep reusable Next.js root-provider behavior in `packages/next`.

## 4. Route layout layer

Route-group layouts such as `apps/templates/cloudigniter-next-aws-v1/src/app/(system)/dashboard/layout.tsx` call `appBootstrap()` and pass the resulting `CiNextContext` to the appropriate `CiLayout` variant.

Tenant-aware application pages have two internal route roots:

```text
apps/templates/cloudigniter-next-aws-v1/src/app/(ci-global)/ci-global/
apps/templates/cloudigniter-next-aws-v1/src/app/(ci-tenant)/ci-tenant/
```

Their layouts follow the same contract: call `appBootstrap()` and pass the
returned value as `context` to `CiLayout`. Pages beneath those layouts call
`appBootstrap()` and pass the same cached context to `CiPage`; they must not add
a second `CiPageWrapper`. The proxy selects the physical tree after validating
the logical route's declared Tenant scopes.

Current layout variants live under `packages/next/src/layout/`, including `app-standard`, `cp-standard`, and `login-standard`. Each variant owns its visual skeleton, such as:

- the main landmark and skip link where applicable;
- header and header controls;
- content container;
- footer and copyright content.

Each `CiLayout` wraps its structure with `CiPageWrapper`. The server wrapper resolves server locale details, checks protected-layout prerequisites, and passes configuration to `CiClientWrapper`.

`CiClientWrapper` supplies the shared client capability stack:

- `CiThemeProvider`;
- `CiDebugProbeProvider`;
- Ant Design `AntdRegistry`;
- `CiFeedbackProvider` and `CiFeedbackHandler`;
- `CiInitialLoader`;
- route children inside the active providers.

Theme configuration reaches `CiClientWrapper` as `{ theme: appCoreConfig.theme, themeProviderProps: appNextResolvedConfig.appThemeProviderProps }`. The client wrapper forwards it unchanged. Defined raw overrides take precedence over mapped generic fields and defaults. Read [theming](../ui/theming.md) for the shared class/data-theme selectors, semantic colors, widget mode observation, and validation contract.

Use `CiLayout` consistently so pages receive the same structural, theme, diagnostics, component-registry, feedback, and initial-loading behavior. Add reusable layout behavior to the owning package wrapper rather than repeating it in application route layouts.

## 5. Page layer

Server page components call `appBootstrap()` and pass the same resolved context to `CiPage`.

`CiPage` is a client component responsible for the page-content boundary. It:

- installs a page-level `NextIntlClientProvider` around the complete page shell;
- owns the scroll container;
- renders the `CiPageShell`;
- renders optional breadcrumbs and the page header;
- applies layout-aware height behavior;
- hosts `CiPageLoader`;
- performs client-side tracing;

The page-level provider uses `setup.messages` when supplied and otherwise uses `context.config.appNextResolvedConfig.messages`. This creates an intentional page override boundary beneath the root provider. It must wrap the complete `CiPageShell`, including breadcrumb and header slots, so every page-owned translation follows the current route's messages during client navigation.

Do not attribute this second next-intl provider to `CiLayout`: the root provider is installed by `CiNextRootWrapper`, while the nested provider is installed by `CiPage`.

### Breadcrumb shortcuts

- `CiPage` passes `setup.withBreadcrumbChildrenMenu` to the Next.js-owned `CiBreadcrumbs`; the default is false.
- `CiBreadcrumbItem.children` is recursive. Keep parent `href` values clickable while hovering exposes children;
  leaf destinations have no submenu. Template composition supplies the route tree, not rendering algorithms.
- Resolve translated labels and alphabetize siblings with the active locale. Exclude hidden subtrees and current
  leaves, but retain current sections as non-navigating parents when they have visible descendants.
- Reuse UI dropdown/submenu primitives for keyboard focus, RTL, pointer grace, collision handling, and portals.
  Keep the root menu open while the pointer traverses any descendant portal. Provide a touch disclosure target
  on parents and retain Enter navigation plus directional-arrow/Space submenu access.
- Navigation adapters used with `asChild` must pass anchor attributes, handlers, and refs through to the native
  anchor and honor `preventDefault()` before navigation. A slotted submenu trigger receives one complete child.
- Keep popover surface/foreground and menu-layer tokens; constrain submenu size to the viewport and available height.

### HTTP error boundaries

- `app/forbidden.tsx` and `app/not-found.tsx` delegate to application-owned `AppHttpErrorPage` branding.
  Generic illustrated rendering extends `CiErrorPage` in UI; `CiNextHttpErrorPage` in Next owns Image/Link integration.
  Core exports additive `CiErrorPageProps`; Next exports `CiNextHttpErrorPageProps` through canonical `/types`.
- Use `forbidden()` in server page guards for confirmed permission denials, before protected data loading.
  Preserve `notFound()` for missing/disabled resources, login redirects for sign-out, and retryable failures for
  provider unavailability. Never detect authorization failure by matching a free-text error message.
- Native `forbidden()` requires `experimental.authInterrupts: true`; it remains an experimental Next.js API.
  Do not invoke it in the root layout or let broad catches normalize its framework interrupt. Already streamed
  responses cannot change status headers. The presentation component alone does not enforce access or set status.
- HTTP error copy lives under `httpErrors` in Next's English/Arabic common locales, with application common overrides.
  The error composition resolves the configured locale cookie/default and loads common messages directly; it does
  not invoke the route-dependent next-intl request hook again. The optional suspension resolver separately uses
  cached appBootstrap for trusted context and retains ordinary denial on failure. Normal-page i18n remains unchanged.
- `/error-preview/access-denied` is a system-scope, public diagnostic route. The thin template page delegates to
  Next's `CiNextAccessDeniedPreview`, which calls `forbidden()` only in development and `notFound()` otherwise.
  It changes no permissions or resources and is not a bypass for actual page or provider authorization.
- Distinguish ordinary 403 (intact locked cloud) from confirmed suspended access (retained cracked locked cloud).
  `CiNextHttpErrorPage.accessSuspended` selects suspension copy only for 403. Use Core's
  `ciIsAuthorizationSuspended` with the actual guard's trusted catalog, subject, requests, and options: a retained
  grant must allow access if only suspension is hypothetically lifted. Never grant from this diagnostic result,
  infer prior access from a suspended entry alone, or select suspension from query strings/free-text errors.
  The template's custom resolver covers Security, Users, Administrators, and user restoration in Trash; unknown
  guards and failed evidence stay ordinary denial. Both variants have English/Arabic common-message overrides.
  `/error-preview/access-suspended` shares the development-only 403 preview gate and simulates this state explicitly.
- Cover confirmed denials before protected reads, missing resources, signed-out redirects, provider outages,
  translation overrides, both themes, RTL, and the non-development preview guard. Check HTTP behavior separately
  from component rendering.
- Next.js 16.2.2's bundled React development profiler can throw on negative error/abort end timestamps. The
  workspace persists `patches/next@16.2.2.patch` through pnpm `patchedDependencies`; guard only the invalid profiling
  entries in all four browser-development clients. Keep native interrupts and valid timing entries intact.
  Revalidate on Next upgrades and carry registration explicitly into standalone distributions; CloudIgniter package
  imports cannot apply an application's dependency patch. Run the installed-runtime regression in
  `packages/next/__tests__/page/rsc-performance.test.cjs`, then verify previews after restarting Next. Do not infer
  browser success from HTTP status alone, add arbitrary waits, or globally override the Performance API.

## 6. Provider hierarchy

For a standard internal page, preserve this effective render tree:

```text
html[lang, dir]
└─ body[className]
   └─ AppRootWrapper
      └─ CiNextRootWrapper
         └─ NextIntlClientProvider (root locale and messages)
            ├─ CiDevBeacon (when authorized)
            ├─ CiDebugProbe (root)
            ├─ Kernel
            └─ CiLayout
               └─ CiPageWrapper (server)
                  └─ CiClientWrapper (client)
                     └─ CiThemeProvider
                        └─ CiDebugProbeProvider
                           └─ AntdRegistry
                              ├─ CiFeedbackProvider
                              ├─ CiFeedbackHandler
                              ├─ CiInitialLoader
                              └─ layout structure
                                 ├─ header
                                 ├─ container
                                 │  └─ CiPage
                                 │     └─ NextIntlClientProvider (page override/fallback)
                                 │        └─ CiPageShell
                                 │           ├─ breadcrumbs/header slots
                                 │           └─ page content
                                 └─ footer
```

Components rendered as siblings may install global UI behavior rather than wrapping children directly. Preserve their placement inside the surrounding providers.

## 7. Server and client boundaries

- Keep `appBootstrap()`, root-context resolution, route layouts, and route page entry points server-side.
- Keep `CiNextRootWrapper` and `CiPageWrapper` server-side because they consume server-resolved context and locale behavior.
- Keep `CiClientWrapper` and `CiPage` client-side because they own browser providers, effects, scrolling, and interactive state.
- Pass serializable context/configuration across the server-to-client boundary; do not pass provider clients, secrets, or server-only objects.
- Do not add `"use client"` to a route layout or page merely to access wrapper behavior. Isolate interactive behavior beneath the existing client wrappers.

## 8. Hydration-stable output

Treat every Client Component in a server-rendered route as participating in two initial renders: one on the
server and one during browser hydration. The same serialized inputs must produce the same visible markup in both
environments.

- Pass the server-resolved application locale through a serializable prop when rendered text is localized. Do
  not let `Intl` select the server or browser host locale implicitly.
- Construct date/time formatters with a concrete locale and `timeZone`. Reuse the shared
  `ciFormatDateTime()` helper for persisted timestamps; it uses an explicit UTC time zone. If a product needs a
  different display zone, resolve it once and pass the same value to both renders.
- Do not call `new Intl.DateTimeFormat(undefined, ...)`, a no-argument `toLocaleString()` variant,
  `Date.now()`, `Math.random()`, or `crypto.randomUUID()` while deriving initial visible markup. Do not branch
  initial markup on `window`, `document`, or another browser-only global. Use a stable server snapshot,
  deterministic identifier, or a post-hydration effect whose initial state matches the server output.
- Pass server-fetched mutable data to the client as the render snapshot. Do not replace it with independently
  fetched changing data before hydration completes.
- Preserve valid HTML nesting. A deterministic value can still fail hydration when the browser repairs invalid
  markup before React attaches.
- Use `suppressHydrationWarning` only for a narrow, intentionally uncontrollable leaf value. It is not a fix for
  application-owned locale, time-zone, clock, randomness, snapshot, or nesting defects.

Add a focused regression whenever a hydration defect is fixed. Prefer an SSR render or hydration test with a
fixed timestamp, explicit locale, and explicit time zone. A source-convention test is appropriate when it
prevents host-default formatting across a reusable UI surface.

## 9. Change rules

- Bootstrap before rendering a CloudIgniter wrapper that requires context.
- Pass the same `CiNextContext` through the layout and page layers for one render.
- Keep `<html>` and `<body>` concerns in root-context resolution and the root layout.
- Keep application root composition in `apps/templates/cloudigniter-next-aws-v1`; keep reusable wrapper behavior in `packages/next` or reusable presentation in `packages/ui`.
- Resolve developer-tools access on the server and propagate only the boolean capability to client providers. Never let client configuration re-enable Debug Probe after the server denies access.
- Preserve the `CiLayout -> CiPageWrapper -> CiClientWrapper` chain when changing internal layouts.
- Preserve both next-intl boundaries unless intentionally redesigning message scope; verify root messages and page overrides separately, including page-owned shell slots.
- Put layout skeleton behavior in `CiLayout` and page-content/scroll behavior in `CiPage`.
- Do not duplicate theme, debug-probe, Ant Design registry, feedback, or initial-loader setup in individual pages.
- Keep initial server and client markup deterministic according to the hydration rules above; pass resolved
  locale, time zone, and mutable-data snapshots through the existing server-to-client boundary.
- Validate protected and unprotected layout variants when shared wrapper behavior changes.

## 10. Diagnostic sequence

For a hydration error, start with React's exact server/client diff. Trace the component that produced the
different text or structure, then inspect implicit locale/time-zone formatting, current-time or random values,
browser-only branches, independently changing data, and invalid nesting in that order. Browser extensions are a
last-mile possibility only after application-owned output is proven deterministic.

When a rendered page lacks context, providers, translations, or expected structure, inspect in this order:

1. Confirm the request participated in the proxy/request-context lifecycle.
2. Confirm `appBootstrap()` returned the expected route, locale-backed config, settings, auth, and environment state.
3. Confirm the root helper derived the expected `<html>` and `<body>` props.
4. Confirm `AppRootWrapper` passed the root context to `CiNextRootWrapper`.
5. Confirm the route selected the intended `CiLayout` variant.
6. Confirm `CiPageWrapper` and `CiClientWrapper` installed the shared providers.
7. Confirm the page received the same context and rendered through `CiPage`.
8. For translation failures, compare root messages with `setup.messages` or the page fallback messages.
9. For scrolling/header/loader defects, inspect `CiPageShell` and `CiPage` rather than the root layout.

## 11. Source map

| Responsibility               | Primary source                                                        |
| ---------------------------- | --------------------------------------------------------------------- |
| Document shell               | `apps/templates/cloudigniter-next-aws-v1/src/app/layout.tsx`                                    |
| Root context                 | `apps/templates/cloudigniter-next-aws-v1/src/kernel/server/root/appResolveRootLayoutContext.ts` |
| Application root composition | `apps/templates/cloudigniter-next-aws-v1/src/kernel/server/root/AppRootWrapper.tsx`             |
| System bootstrap             | `apps/templates/cloudigniter-next-aws-v1/src/kernel/server/bootstrap/app-bootstrap.ts`          |
| Reusable root providers      | `packages/next/src/server/wrapper/CiNextRootWrapper.tsx`              |
| Layout variants              | `packages/next/src/layout/*/CiLayout.tsx`                             |
| Server layout wrapper        | `packages/next/src/server/wrapper/CiPageWrapper.tsx`                  |
| Shared client providers      | `packages/next/src/client/wrapper/CiClientWrapper.tsx`                |
| Page-content shell           | `packages/next/src/client/page/CiPage.tsx`                            |
