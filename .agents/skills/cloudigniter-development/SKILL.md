---
name: cloudigniter-development
description: Apply CloudIgniter architecture, package ownership, Next.js application request lifecycle, page-rendering and layout composition, root and route bootstrapping, next.config.ts and proxy integration, tenant/route request-context construction, next-intl message resolution, EmberGuard layering, public API, runtime-boundary, provider-binding, and validation conventions. Use when implementing, debugging, refactoring, or reviewing CloudIgniter code in packages/core, packages/emberguard, packages/next, packages/aws, packages/ui, or apps/template.
---

# CloudIgniter Development Workflow

Use this skill for development work in the CloudIgniter repository. Treat `AGENTS.md` as mandatory and this skill as its implementation workflow.

## Load only the relevant references

Read every reference selected for the task completely before changing code.

- Read [architecture-overview.md](references/architecture-overview.md) for repository architecture, dependency direction, and the template-versus-package boundary.
- Read [package-ownership.md](references/package-ownership.md) when deciding whether work belongs in `core`, `emberguard`, `next`, a provider package, `ui`, or the template.
- Read [request-lifecycle.md](references/request-lifecycle.md) whenever work touches or depends on `next.config.ts`, `proxy.ts`, routing, tenant/org-unit resolution, request context, redirects/rewrites, bootstrapping, next-intl, locale messages, request headers, or request cookies.
- Read [page-rendering.md](references/page-rendering.md) whenever work touches the root layout, route-group layouts, page components, `appBootstrap()`, `appResolveRootLayoutContext()`, `AppRootWrapper`, `CiLayout`, `CiPageWrapper`, `CiClientWrapper`, `CiPage`, or their provider hierarchy.
- Read [public-api-and-runtime.md](references/public-api-and-runtime.md) when adding or changing public types, exports, modules, package dependencies, or client/server code.
- Read [emberguard.md](references/emberguard.md) for authentication, authorization, actors, sessions, roles, permissions, policies, claims, or provider binding.
- Read [validation.md](references/validation.md) before validating a non-trivial change or reviewing its final diff.

Do not load every reference by default. Select the smallest set that fully covers the task.

## Core principles

1. Do not equate the requested file with the implementation owner.
2. Treat `apps/template` as application composition and configuration, not a hidden platform package.
3. Put reusable Next.js request/runtime behavior in `packages/next` and keep the template integration thin.
4. Preserve the actual request lifecycle. Do not modify `next.config.ts`, `proxy.ts`, request context, or i18n in isolation when they form one execution chain.
5. Keep serialized request context minimal and request-specific. Never embed route registries, full configuration, message catalogs, provider clients, or other application-wide data.
6. Preserve client/server, framework, provider, and public API boundaries.
7. Search for existing abstractions before creating another helper, type, component, adapter, or resolver.
8. Validate the affected package chain and consumer, not only the edited file.

## Workflow

### 1. Understand the behavior

Identify:

- the externally visible behavior;
- the full request/build/runtime path involved;
- whether the behavior is reusable;
- whether it is generic, Next.js-specific, provider-specific, EmberGuard-specific, UI-specific, or application-specific;
- affected public contracts, configuration, and runtime boundaries.

Separate the requested outcome from the files named in the request.

### 2. Trace before editing

Use Graphify first when `graphify-out/graph.json` exists, then confirm behavior in source.

Search for:

- definitions and all consumers;
- package barrels and exports;
- related types and guards;
- configuration entry points;
- tests and diagnostics;
- build-time wiring such as `next.config.ts`;
- request-time wiring such as `proxy.ts` and next-intl request configuration.

For request/i18n work, trace at least:

```text
next.config.ts
    → proxy.ts
    → packages/next request pipeline
    → request-context header/cookie
    → apps/template/src/kernel/server/i18n/request.ts
    → message loader
    → app bootstrap/providers/components
```

Do not infer that a file is unused merely because application code does not import it directly. Framework configuration may register it.

### 3. Determine ownership

Use the ownership references and choose the lowest correct layer:

```text
internal generic capability      → packages/emberguard
public generic API and types     → packages/core
Next.js runtime integration      → packages/next
provider implementation          → packages/aws or another provider
reusable presentation            → packages/ui
application composition/config   → apps/template
```

When a template file must remain an application entry point, move reusable implementation behind an intentional package API and leave configuration or delegation in the template.

### 4. Design the change

Before coding, determine:

- the owning package;
- the public entry point, if any;
- the direction of dependencies;
- the runtime boundary;
- compatibility impact;
- how the change affects the request lifecycle;
- the focused validation needed.

For request context, explicitly identify:

- who creates it;
- when tenant and route resolution occur;
- whether the consumer reads a same-request header or a cross-request cookie;
- whether the target path bypasses the proxy;
- how stale, missing, malformed, or mismatched context is rejected.

### 5. Implement package capability first

When behavior is reusable:

1. Implement it in the owning package.
2. Add or update canonical public types when needed.
3. Export only the stable API through `/client`, `/server`, `/lib`, or `/types`.
4. Integrate it into higher layers.
5. Update `apps/template` last with thin composition.

Do not build a complete template-local implementation and wrap it afterward.

### 6. Preserve lifecycle invariants

For request lifecycle changes:

- keep `next.config.ts` limited to Next.js/build/plugin composition;
- resolve tenant and org-unit context before matching the logical feature route;
- create unresolved context only for branches that intentionally lack a route;
- create resolved context only after route resolution and access decisions;
- forward resolved context through the same-request header;
- use cookies only where a later browser request or redirect requires transport;
- correlate cookie-derived context with an authoritative pathname;
- keep message selection driven by the resolved route namespace;
- keep core messages lower precedence than application overrides.

Read [request-lifecycle.md](references/request-lifecycle.md) for the complete invariants and diagnostic sequence.

### 7. Validate and review

Run validation proportional to the affected scope. At minimum:

- typecheck the owning package;
- run focused tests;
- validate the public export when changed;
- validate at least one consuming layer;
- inspect the final diff for ownership, dependency, runtime, and lifecycle regressions;
- run `graphify update .` after code or architecture-document changes.

If a broad check is already failing, distinguish related failures from baseline failures and report both honestly.

Use [validation.md](references/validation.md) for the final checklist.

## Completion report

For substantial changes, report concisely:

```text
Ownership:
<owning package/domain>

Request lifecycle:
<affected stages and preserved invariants, when relevant>

Public API:
<entry point or internal only>

Template impact:
<remaining composition/configuration>

Compatibility:
<none, additive, or intentional breaking change>

Validation:
<checks performed and known unrelated blockers>
```
