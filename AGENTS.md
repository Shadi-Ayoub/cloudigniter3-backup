# CloudIgniter Repository Instructions

These instructions apply to all work performed in the CloudIgniter repository.

CloudIgniter is a reusable application platform composed of public API packages, internal capability packages, provider implementations, framework integration packages, shared UI, and a reference application template.

Changes must preserve package ownership, dependency direction, public API boundaries, runtime separation, extensibility, and maintainability.

## 1. Architecture First

Before implementing any non-trivial change, determine where the functionality belongs.

Do not assume that the file shown in the task is the correct implementation location.

In particular, when a requested change originates in `apps/template`, first determine whether the requested behavior is reusable CloudIgniter functionality that belongs in a package.

Use this default ownership model:

- `packages/core`
  - Primary public API for platform- and provider-agnostic CloudIgniter capabilities.
  - Public platform contracts and domain models.
  - Public types for generic CloudIgniter concepts.
  - Platform- and provider-agnostic helpers.
  - Generic configuration contracts.
  - Generic normalization and resolution logic.
  - Public API entry point for platform/provider-agnostic EmberGuard helpers and all EmberGuard public types.

- `packages/emberguard`
  - Internal EmberGuard capability/domain implementation.
  - Security/authentication/authorization capability internals that are platform- and provider-agnostic.
  - Internal implementation details that should normally remain hidden behind `packages/core`.
  - Must not become a second public API surface that application developers import directly unless explicitly designed otherwise.

- `packages/next`
  - Next.js-specific CloudIgniter implementation and integration layer.
  - Next.js routing, request handling, request context, and runtime integration.
  - Next.js implementation layer for EmberGuard.
  - Wires the platform/provider-agnostic EmberGuard API to the configured/selected provider.
  - Framework-specific modules, adapters, client/server helpers, and runtime orchestration.

- `packages/aws`
  - AWS-specific provider implementation.
  - AWS Amplify integration.
  - Cognito integration.
  - AWS services and provider-specific adapters/contracts.
  - Must not own generic CloudIgniter or generic EmberGuard contracts that belong in `packages/core`.

- `packages/ui`
  - Reusable UI components and primitives.
  - Shared presentation behavior.
  - Generic client-side UI utilities.
  - Shared design-system extensions.

- `apps/template`
  - Application composition.
  - Application configuration.
  - Application-specific wiring.
  - Route/page composition.
  - Developer customization examples.
  - Reference usage of CloudIgniter APIs.

The application template should consume CloudIgniter rather than contain CloudIgniter.

## 2. EmberGuard Architectural Boundary

Treat EmberGuard as a layered capability rather than a package that application code consumes directly.

The preferred architectural flow is:

```text
packages/emberguard
    internal platform/provider-agnostic capability implementation
            ↓ exposed through
packages/core
    public platform/provider-agnostic helpers + all public EmberGuard types
            ↓ implemented/wired for Next.js by
packages/next
    Next.js runtime integration + selected-provider binding
            ↓ uses provider implementation from
packages/aws or another provider package
            ↓ consumed by
apps/template
```

### Public API rule

Application code and other CloudIgniter consumers should normally import platform/provider-agnostic EmberGuard APIs from:

```text
@cloudigniter/core/lib
@cloudigniter/core/types
```

or another intentional `@cloudigniter/core` public entry point.

Do not require consumers to import directly from `@cloudigniter/emberguard` for generic helpers or public types when `packages/core` is intended to expose them.

### Implementation rule

Next.js-specific EmberGuard behavior belongs in `packages/next`.

`packages/next` is responsible for integrating the generic EmberGuard capability with:

- Next.js request/runtime concepts;
- the configured CloudIgniter provider;
- provider-specific adapters such as AWS/Cognito implementations.

Do not place provider selection or Next.js runtime wiring into `packages/core` or `packages/emberguard`.

### Provider rule

Provider-specific implementations belong in provider packages such as `packages/aws`.

Generic EmberGuard contracts must not become AWS-specific merely because AWS is the currently selected provider.

## 3. Prefer Package Implementation Over Template Implementation

Reusable platform functionality must normally be implemented in the appropriate package.

Do not place reusable logic in `apps/template` merely because:

- the task references a template file;
- the current caller is in the template;
- it is faster to implement locally;
- only one application currently uses the functionality.

Ask instead:

> Would another application built using CloudIgniter reasonably need this functionality?

If yes, it probably belongs in a package.

Keep only application-specific composition, configuration, and customization in `apps/template`.

## 4. Determine Ownership Before Coding

For every significant change:

1. Understand the requested behavior.
2. Search the repository for existing related implementations.
3. Identify the architectural owner.
4. Identify whether the capability belongs to `core`, `emberguard`, `next`, a provider package, `ui`, or the application template.
5. Identify the appropriate runtime boundary.
6. Check whether an existing abstraction can be reused or extended.
7. Implement the reusable capability in the owning package.
8. Expose it through the intended public package entry point.
9. Integrate it into `apps/template` only where application composition is required.
10. Validate all affected package consumers.

Do not implement first and decide ownership afterward unless the task is explicitly exploratory.

## 5. Search Before Creating

Before creating a new:

- helper;
- component;
- hook;
- type;
- interface;
- resolver;
- context;
- configuration object;
- adapter;
- module;
- utility;

search the repository for equivalent or closely related functionality.

Prefer, in order:

1. Reusing an existing abstraction.
2. Extending an existing abstraction.
3. Generalizing an existing implementation.
4. Extracting duplicated behavior into the correct shared layer.
5. Creating a new abstraction only when the existing architecture does not fit.

Avoid parallel implementations that differ only slightly.

## 6. Canonical Types Entry Point

Every public CloudIgniter package must expose public types through one canonical package entry point.

Typical public type entry points are:

```ts
@cloudigniter/core/types
@cloudigniter/next/types
@cloudigniter/aws/types
@cloudigniter/ui/types
```

For EmberGuard specifically:

> All public platform- and provider-agnostic EmberGuard types must be exposed through `@cloudigniter/core/types`.

Do not require application developers to import generic EmberGuard public types from `@cloudigniter/emberguard/types`.

Public types may be organized internally by domain.

Preferred structure:

```text
src/
└── types/
    ├── auth/
    │   ├── ...
    │   └── index.ts
    ├── tenant/
    │   ├── ...
    │   └── index.ts
    ├── org-unit/
    │   ├── ...
    │   └── index.ts
    ├── emberguard/
    │   ├── ...
    │   └── index.ts
    ├── routing/
    │   ├── ...
    │   └── index.ts
    └── index.ts
```

The actual domain folder names must follow the repository's established terminology.

The root `src/types/index.ts` aggregates the public types exported by the package.

Domain subfolders are encouraged. A single large physical `types.ts` file is not required or desired.

The important rule is:

> One canonical public types entry point per package, with internally organized domain-specific type folders.

Before adding a public type:

1. Search for an existing equivalent type.
2. Identify the owning public API package.
3. Identify the appropriate domain folder under `src/types`.
4. Add or update the domain's exports.
5. Export the type through `src/types/index.ts`.
6. Ensure the package exposes the `/types` entry point.

Avoid defining reusable public domain contracts inside implementation files.

Private implementation-only types may remain colocated with the implementation when they are not part of the package API.

## 7. Import Public Types Through `/types`

Consumers should import public CloudIgniter types from the owning package's canonical `/types` entry point.

Prefer:

```ts
import type {
  CiRequestContext,
  CiTenantContext,
} from "@cloudigniter/core/types";
```

For generic EmberGuard public types, also use:

```ts
import type {
  // EmberGuard public types
} from "@cloudigniter/core/types";
```

Avoid exposing the same public type through multiple unrelated entry points.

Avoid deep imports such as:

```ts
@cloudigniter/core/src/types/tenant/...
@cloudigniter/emberguard/src/...
@cloudigniter/next/src/modules/...
```

unless the path is explicitly designed as a supported public API.

## 8. Respect Public Package Entry Points

Use intentional package entry points rather than package internals.

Typical CloudIgniter entry points include:

```text
@cloudigniter/<package>/client
@cloudigniter/<package>/server
@cloudigniter/<package>/lib
@cloudigniter/<package>/types
```

Their responsibilities are different:

- `/client`
  - Client-runtime functionality.
  - React client components and hooks.
  - Browser-safe APIs.

- `/server`
  - Server-only functionality.
  - Server integrations.
  - APIs requiring Node.js or server runtime access.

- `/lib`
  - Runtime-neutral or broadly reusable helpers.
  - Pure utilities where practical.

- `/types`
  - Public type contracts.

For EmberGuard, generic public helpers and types should normally surface through `packages/core`, while Next.js runtime implementations surface through the appropriate `packages/next` entry point.

When adding externally consumed functionality, update the correct public export rather than requiring consumers to use deep imports.

## 9. Preserve Client and Server Boundaries

Do not accidentally expose server code through client entry points.

Client code must not transitively import:

- Node.js-only APIs;
- Next.js server-only APIs;
- AWS server SDK functionality;
- server credentials;
- secrets;
- server-only configuration.

Do not add `"use client"` merely to resolve an architectural problem.

Move code to the appropriate runtime boundary instead.

Prefer runtime-neutral code where the functionality does not actually require a client or server environment.

## 10. Preserve Dependency Direction

Do not introduce architectural dependency inversion.

General principles:

- Framework-independent code must not depend on Next.js.
- Generic platform code must not depend directly on AWS-specific implementations.
- `packages/emberguard` must remain platform- and provider-agnostic.
- `packages/core` may expose EmberGuard's generic public API but must not select or bind a provider.
- `packages/next` may depend on generic contracts and provider adapters to perform runtime integration.
- Provider packages such as `packages/aws` must implement provider-specific behavior without redefining generic platform contracts.
- Reusable packages must never depend on `apps/template`.
- Generic UI must not depend on application-specific code.
- Lower-level contracts should not depend on higher-level implementations.

Before adding a new cross-package dependency, verify that it follows the existing dependency architecture.

If functionality requires capabilities from another layer, prefer contracts, adapters, callbacks, providers, or dependency injection over inappropriate direct coupling.

## 11. Keep CloudIgniter Extensible

CloudIgniter is intended to support applications built and customized by consuming developers.

Prefer:

- configuration;
- contracts;
- adapters;
- providers;
- callbacks;
- extension points;
- sensible generic defaults;

over application-specific hardcoding.

Do not encode assumptions from `apps/template` into reusable packages unless those assumptions are part of the CloudIgniter platform contract.

Default UI content, branding, text, imagery, and behavior intended for application developers must remain generic and replaceable.

Provider-specific details must remain behind provider abstractions.

## 12. Preserve Existing Module Architecture

When working with CloudIgniter modules, inspect existing module conventions before creating new structures.

Do not invent a parallel module architecture.

Respect established concepts such as:

```text
manifest
client
server
lib
types
```

and their associated public package entry points.

Framework-independent module contracts should live at the appropriate lower-level package when possible.

Implementation details should remain hidden behind public exports.

## 13. Hide Implementation Details

Expose the smallest useful public API.

Do not make internal helpers public simply because another file needs them.

Prefer exposing:

- stable contracts;
- stable functions;
- stable components;
- intentionally supported extension points;

while keeping implementation details internal to the owning package.

For EmberGuard, avoid turning `packages/emberguard` into an application-facing import surface when `packages/core` is the intended public API facade.

Avoid increasing public API surface unnecessarily.

## 14. Preserve Backward Compatibility

Treat exported functions, components, types, configuration structures, and package entry points as public contracts.

Prefer additive changes when practical.

Before changing an existing public API:

1. Search all consumers.
2. Determine compatibility impact.
3. Prefer extending the API rather than replacing it.
4. Update all affected consumers when a breaking change is intentional.
5. Remove obsolete code only when its replacement is established.

Do not casually rename or relocate public symbols.

## 15. Keep TypeScript Strict

Do not solve design problems by weakening type safety.

Avoid:

- unnecessary `any`;
- broad assertions;
- double assertions;
- suppressing TypeScript errors;
- duplicating structurally equivalent types;
- converting meaningful unions into generic strings.

Prefer:

- domain-specific types;
- narrowing;
- discriminated unions;
- type guards;
- generic constraints;
- proper optionality;
- exhaustive handling where appropriate.

When a TypeScript error reveals an incorrect contract, fix the contract rather than suppressing the error.

## 16. Follow CloudIgniter Naming Conventions

Inspect related existing APIs before naming new symbols.

Follow established CloudIgniter conventions where applicable, including:

```text
Ci...
ci...
```

Names should describe domain responsibility rather than the screen or file where the functionality was first required.

Avoid introducing alternate terminology for an existing CloudIgniter concept.

## 17. UI Belongs at the Correct Layer

Before creating application-local UI, determine whether it is reusable.

Reusable CloudIgniter UI belongs in `packages/ui` or the appropriate framework package when framework integration is required.

Prefer existing CloudIgniter UI primitives and established component patterns.

Maintain:

- accessibility;
- keyboard behavior;
- responsive behavior;
- dark-mode compatibility;
- established visual conventions.

Do not duplicate a reusable component inside `apps/template`.

## 18. Keep Configuration Generic

Do not hardcode:

- tenant assumptions;
- route assumptions;
- provider assumptions;
- environment-specific values;
- branding;
- locale assumptions;
- development-only behavior;

unless the platform contract explicitly requires them.

Use existing configuration structures and resolved configuration where available.

Provider selection should occur in the appropriate integration/configuration layer, not in generic `core` or `emberguard` code.

Development-only behavior must be clearly isolated.

## 19. Use Existing Error Conventions

Before introducing new error structures or normalization helpers, inspect existing CloudIgniter error handling.

Reuse established:

- error payloads;
- error normalization;
- severity models;
- diagnostic structures;
- server/client error boundaries;

where appropriate.

Do not create an ad hoc error format when an existing CloudIgniter contract already covers the use case.

## 20. Refactor Related Architectural Debt

If the requested task exposes directly related:

- duplicated helpers;
- misplaced reusable logic;
- incorrect package ownership;
- obsolete exports;
- inconsistent types;
- redundant components;

correct the issue when the refactor is reasonably contained within the task.

Do not preserve an obviously incorrect architectural boundary merely to minimize the number of changed files.

At the same time, avoid unrelated repository-wide refactoring.

## 21. Prefer Focused Changes

Make the smallest change that correctly satisfies:

- the requested behavior;
- CloudIgniter architecture;
- package ownership;
- public API consistency;
- type safety.

Do not perform unrelated cleanup simply because nearby code could be improved.

## 22. Validate Public Exports

Whenever public functionality is added, moved, or renamed:

1. Update the appropriate source barrel.
2. Update package exports or build configuration when required.
3. Verify intended imports from consuming packages or applications.
4. Verify runtime boundaries.
5. Remove obsolete import paths when appropriate.
6. Search for accidental deep imports.
7. For EmberGuard generic APIs, verify the application-facing import comes from `packages/core`, not directly from `packages/emberguard`.
8. For Next.js EmberGuard behavior, verify implementation is exposed through the appropriate `packages/next` entry point.

A feature is not complete if its implementation exists but cannot be consumed through the intended CloudIgniter API.

## 23. Validate Changes

Before considering a task complete, run the relevant validation available in the repository.

Depending on the affected scope, this may include:

- TypeScript checks;
- linting;
- package builds;
- application builds;
- tests;
- targeted runtime checks.

When package exports change, validate both the package and at least the relevant consumer.

When EmberGuard-related layering changes, validate the affected chain as applicable:

```text
emberguard → core → next → provider → apps/template
```

Do not consider successful compilation of one changed file sufficient validation for a change affecting package APIs.

## 24. Review the Final Diff Architecturally

Before finishing a significant implementation, inspect the resulting changes and ask:

- Did reusable logic accidentally remain in `apps/template`?
- Is every new public type owned by the correct public API package?
- Are generic EmberGuard public types exposed through `@cloudigniter/core/types`?
- Are generic EmberGuard helpers exposed through an intentional `@cloudigniter/core` entry point?
- Did application code start importing directly from `packages/emberguard` unnecessarily?
- Is Next.js EmberGuard wiring located in `packages/next`?
- Is provider-specific behavior still isolated in the provider package?
- Did provider selection leak into generic `core` or `emberguard` code?
- Did I introduce unnecessary deep imports?
- Did I create duplicate helpers or types?
- Did I expose implementation details unnecessarily?
- Did I cross a client/server boundary incorrectly?
- Did I introduce an unnecessary package dependency?
- Is the template still primarily consuming package functionality?
- Is the API generic enough for other CloudIgniter applications?

Correct architectural issues before considering the task complete.

## 25. Explain Significant Architectural Decisions

For significant changes, briefly report:

- which package owns the implementation;
- whether EmberGuard internals, the `core` API facade, `next` integration, or a provider package is involved;
- why that package owns it;
- which public entry point exposes it;
- what remains in `apps/template`;
- whether public APIs changed;
- what validation was performed.

Do not provide lengthy explanations for trivial changes.

## 26. Treat These Instructions as Living Architecture Rules

When repeated review feedback exposes a general CloudIgniter development rule, propose adding or refining an instruction.

Good repository-wide instructions describe recurring architectural principles.

Do not add one-off implementation details or task-specific preferences to this file.

For detailed CloudIgniter architecture and implementation workflow, use the `cloudigniter-development` repository skill. Load only the focused references routed by that skill; do not assume its request lifecycle or package boundaries from memory.

### Keep Repository Skills Synchronized

Whenever a change modifies documented CloudIgniter architecture, update the relevant repository skill architecture documentation in the same change, even when the task does not explicitly request documentation updates.

This includes changes to package ownership, dependency direction, public API or runtime boundaries, request lifecycle, routing and context transport, rendering and provider hierarchy, EmberGuard layering, provider binding, or other behavior captured by a repository skill.

For each architecture change:

1. Identify the repository skill that owns the affected architectural guidance.
2. Update the focused architecture reference under that skill, such as `.agents/skills/cloudigniter-development/references/*.md`.
3. Update the skill's `SKILL.md` description or reference-routing instructions when the change adds, removes, or renames an architectural area or changes when the reference should be loaded.
4. Validate the skill and its relative reference links.

Do not consider an architecture-changing implementation complete while the relevant repository skill still describes the previous architecture.

## 27. Keep the Developer Guide Synchronized

Treat `developer-guide` as part of the product, not as optional follow-up work.

Use the `cloudigniter-guide-authoring` repository skill whenever a change adds, modifies, fixes, deprecates, or removes:

- an application-facing capability or workflow;
- a public API, type, component, hook, class, constant, or package entry point;
- configuration, defaults, environment variables, or runtime behavior;
- package architecture, request/rendering lifecycle, provider integration, or extension rules;
- user-facing UI behavior or operational/troubleshooting guidance.

For every product change:

1. Inspect the implementation, public exports, types, tests, and current guide coverage.
2. Identify all affected audiences: CloudIgniter Users, CloudIgniter Developers, and API Reference. The Skills tab is special: it is generated from `.agents/skills` and `.codex/skills`, so do not copy skill files into `developer-guide` or require a guide edit for every skill change. Update a source skill only when Codex identifies a concrete improvement; update the guide when the Skills navigation or staging mechanism changes.
3. Update every affected guide page in the same change.
4. Update category metadata, indexes, navigation, and cross-links when discoverability changes.
5. Validate exact imports, signatures, defaults, runtime boundaries, examples, and failure behavior against source.
6. Run `pnpm --filter developer-guide typecheck` and `pnpm --filter developer-guide build`.
7. Report the guide pages and audiences updated.

A product-change task is not complete while its affected guide content still describes the previous behavior. When a change is genuinely internal and preserves all documented behavior, still perform the documentation-impact review and state the concrete reason no guide page changed.

When guide work exposes a recurring gap, suggest a focused improvement to the `cloudigniter-guide-authoring` skill, navigation, templates, validation, or API-coverage workflow. Implement the improvement when it is contained and directly relevant; otherwise report it as a follow-up.

## 28. Trace the Application Request Lifecycle

Treat the following as one connected application lifecycle:

```text
apps/template/next.config.ts
    → apps/template/src/proxy.ts
    → packages/next proxy and request-context handling
    → apps/template/src/kernel/server/i18n/request.ts
    → route message loading
    → application bootstrap and providers
```

Before modifying any stage, read the `cloudigniter-development` skill's `references/architecture/tenants/overview.md` and every affected focused Tenant-lifecycle reference completely, then inspect every affected stage in source.

### `next.config.ts`

`apps/template/next.config.ts` is the application-level Next.js build and plugin composition entry point. It registers integrations that may invoke files without normal application imports. In particular, the next-intl plugin registers `apps/template/src/kernel/server/i18n/request.ts`, which supplies locale and messages to next-intl server APIs.

When changing `next.config.ts`:

- preserve existing wrapper/plugin composition;
- preserve monorepo transpilation and workspace-root behavior unless intentionally changing it;
- keep request/business logic out of the configuration file;
- update and validate every registered runtime file when its path or contract changes.

Do not classify a registered file as unused merely because no application source imports it directly.

### `proxy.ts`

`apps/template/src/proxy.ts` is the thin application request entry point and matcher. Reusable Next.js processing belongs in `packages/next`.

Preserve this strategy:

1. Resolve proxy-safe application configuration.
2. Normalize the public request pathname.
3. Resolve Tenant and Org Unit context.
4. Derive the logical feature pathname.
5. Resolve the registered route against that feature pathname.
6. Apply route/authentication redirect decisions.
7. Construct a minimal request context only after the relevant resolution stage.
8. Forward resolved context through a same-request header.
9. Persist a cookie only when a redirect or separate browser request requires cross-request transport.
10. Perform the final Tenant-aware rewrite.

An unresolved context with `route: null` is valid only for branches intentionally lacking a registered route, such as information or unregistered-route handling. It must not silently reach normal page i18n resolution.

The proxy matcher is part of this contract. Static, API, framework-internal, and `ci-internal` paths may bypass the proxy; consumers on those paths must not assume they inherit the page request's forwarded header.

### Request context

Keep request context minimal and request-specific. Do not serialize route registries, full configuration, locale catalogs, provider clients, secrets, or large diagnostics.

- Treat the proxy-generated header as same-request transport.
- Treat the cookie as cross-request transport that may be stale and client-controlled.
- Correlate cookie-derived route context with an authoritative pathname.
- Do not use cookie context as authorization evidence without authoritative validation.
- Account for redirects creating a new request that cannot inherit forwarded headers.

### i18n request resolution

`apps/template/src/kernel/server/i18n/request.ts` is invoked through the next-intl registration in `next.config.ts`. For a normal proxied page it must:

1. Resolve the configured locale.
2. Read and validate the proxy-generated request-context header.
3. Require a resolved route.
4. Use the resolved route namespace and logical pathname to load the message chain.
5. Return the locale and effective messages to next-intl.

A locale key existing on disk does not prove it exists in the active message bundle. Verify the resolved route namespace, namespace-to-file expansion, locale registry, core/custom merge order, and messages passed to the provider.

When changing routing, request context, or i18n, validate the complete affected chain rather than only the edited file.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:

- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## UI/UX and design

- For any user-facing UX, visual-design, frontend UI, responsive-layout, accessibility, design-system, or component-styling task, use the `ui-ux-pro-max` skill before proposing or implementing changes.
- Apply its recommendations within CloudIgniter’s existing architecture and component boundaries:
  - `packages/ui` for reusable UI primitives and shared components.
  - `packages/next` for Next.js-specific UI integrations.
  - `apps/template` for application composition and product-specific screens.
- Preserve the existing CloudIgniter design language, tokens, theming, localization, RTL support, and accessibility requirements. Do not introduce a competing design system or duplicate an existing shared component.
- Before creating a new UI component, search for and reuse or extend an existing CloudIgniter component when suitable.
- For visual changes, verify desktop and mobile layouts, keyboard interaction, focus states, semantic HTML, contrast, loading/empty/error states, and RTL behavior where direction-aware UI is involved.
- Treat the generated UI/UX Pro Max design system as guidance; repository conventions and explicit product requirements take precedence.
