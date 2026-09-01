---
name: cloudigniter-development
description: Apply CloudIgniter architecture and ownership conventions, including developer-role feature gates and JSON seed/cleanup workflows, reversible resource deletion and Trash workflows, Resource Studio and Data Entity planners, generated backend/frontend artifacts, collision-safe create/update/drop/undo transactions, local Studio security, AWS SSO/STS verification and one-shot Amplify sandbox deployment, macOS AppleDouble cleanup safety, DynamoDB persistence and table keys, hydration-safe Next.js routing and rendering, access control, CiDataTable management pages, public APIs, runtime boundaries, and validation. Use when implementing, debugging, refactoring, reviewing, or documenting CloudIgniter code in packages/cli, packages/core, packages/emberguard, packages/next, packages/aws, packages/ui, apps/template, or the developer guide.
---

# CloudIgniter Development Workflow

Use this skill for development work in the CloudIgniter repository. Treat `AGENTS.md` as mandatory and this skill as its implementation workflow.

## Load only the relevant references

Read every reference selected for the task completely before changing code.

The references are grouped by reading level: `architecture` for system and domain contracts, `cli` for command/tooling workflows, and `authoring` for implementation review and validation.

### Architecture

- Start with the [architecture overview](references/architecture/overview.md) for repository structure, dependency direction, and the template-versus-package boundary.
- Read [package ownership](references/architecture/packages/ownership.md) when deciding whether work belongs in `core`, `emberguard`, `next`, a provider package, `ui`, or the template; add the [template core/custom boundary](references/architecture/packages/template-core-custom-boundary.md) for template or generator work and [public API/runtime boundaries](references/architecture/packages/public-api-and-runtime.md) for exports, dependencies, or client/server code.
- Start with the [access-control overview](references/architecture/access-control/overview.md), then select [permissions and scopes](references/architecture/access-control/permissions.md), [roles](references/architecture/access-control/roles.md), [assignments and enforcement](references/architecture/access-control/assignments.md), [catalog composition and overrides](references/architecture/access-control/catalog-and-overrides.md), [administration](references/architecture/access-control/administration.md), and [access-control validation](references/architecture/access-control/validation.md) as the task requires.
- Read [EmberGuard](references/architecture/security/emberguard.md) for authentication, authorization, actors, sessions, policies, claims, or provider binding.
- Start with the [Tenant request-lifecycle overview](references/architecture/tenants/overview.md), then select [routing](references/architecture/tenants/routing.md), [request context and localization](references/architecture/tenants/context-and-localization.md), or [bootstrap and diagnostics](references/architecture/tenants/bootstrap-and-diagnostics.md) when work touches `next.config.ts`, `proxy.ts`, Tenant/Org Unit resolution, redirects/rewrites, next-intl, headers, cookies, bootstrap, or internal endpoints.
- Read [Org Unit trees and tenant sharing](references/architecture/tenants/org-units.md) for Org Unit management, shared subtrees, tenant attachments, hierarchy-aware authorization, routing lookup, or Org Unit seeding.
- Read [users and identity administration](references/architecture/users/overview.md) for application users, Cognito identities, user profiles, user-role creation, user management pages, suspension, soft deletion, restoration, or purge.
- Read [page rendering](references/architecture/rendering/page-rendering.md) for root layouts, route-group layouts, pages, bootstrap wrappers, providers, `CiLayout`, `CiPageWrapper`, `CiClientWrapper`, `CiPage`, or server/client hydration mismatches involving locale, time zone, clocks, randomness, browser-only branches, or mutable snapshots.
- Read [DynamoDB design](references/architecture/persistence/dynamodb.md) for any persisted DynamoDB record or table decision, and [table keys](references/architecture/persistence/table-keys.md) for `PK`, `SK`, or secondary-index keys.
- Read the [data-table interaction contract](references/architecture/ui/data-table.md) for management pages built around `CiDataTable`.
- Read [collection ordering and resource recency](references/architecture/ui/presentation-defaults.md) when work renders chips, dropdown options, trees, data-table sorting, or newly created-resource badges.
- Start with the [resources overview](references/architecture/resources/overview.md). For Resource Studio, select its [overview](references/architecture/resources/studio/overview.md), [data entities and generation](references/architecture/resources/studio/data-entities-and-generation.md), [transactions](references/architecture/resources/studio/transactions.md), [deployment and security](references/architecture/resources/studio/deployment-and-security.md), and [validation](references/architecture/resources/studio/validation.md) as needed. Read the [resource deletion lifecycle](references/architecture/resources/deletion.md) for deletion, restoration, purge, retention, Trash UI, or provider cleanup.

### CLI

- Read [CLI development](references/cli/development.md) for `@cloudigniter/cli`, `ci`, `ci-dev`, commands, flags, prompts, subprocesses, terminal output, exit codes, publishing, or invoking package scripts.
- Read [development tools and seeding](references/cli/development-tools-and-seeding.md) for developer-role gates, Dev Beacon, Debug Probe, development-only UI, seed manifests/fixtures, the canonical single-action Seeder dialog, cleanup operations, provenance markers, garbage collectors, seeder commands, or fixture/payload drift from a deployed Amplify schema and generated outputs.

### Authoring and review

- Read [validation and final review](references/authoring/validation.md) before validating a non-trivial change or reviewing its final diff.

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
9. Treat the `CiDataTable` interaction contract as a cross-page consistency requirement, not page-local styling.
10. Build CloudIgniter-owned table keys with the public core helpers; never introduce a new manually concatenated PK, SK, or secondary-index key.
11. Use bounded-context tables: combine related entity types only when their access patterns, security boundary, lifecycle, and operational profile align. Never default to one platform-wide table or one table per entity.
12. Treat every new table, index, scan, stream, replica, backup mode, capacity-mode change, and consistency choice as a cost and safety decision. Document the access pattern and cheaper safe alternative before implementing it.
13. Keep application/system commands under `ci` and monorepo-only commands under the workspace-gated `ci-dev` executable; share infrastructure through `packages/cli` without mixing their help trees.
14. Keep application-owned implementation only in `amplify/custom`, `src/custom`, and scoped `(ci-custom)` route trees. Template-core files may bridge custom inputs only through thin, strict composition; reusable code belongs in packages.
15. Let generators rewrite only registered generated-owned resource folders and generated registries. Reject every core/manual/generated key or path collision before mutating files, and never silently adopt or overwrite hand-written code.
16. Keep local generation and cloud deployment separate. A generated-resource deployment requires an explicit target, a short-lived single-use intent bound to the exact generated plan and verified provider identity/Region, and a complete recheck immediately before the provider subprocess.
17. Treat macOS `._*` files as ownership-sensitive metadata. Record exact pre-existing artifacts and intended outputs before Codex or a CloudIgniter tool creates or generates files, then remove only exact AppleDouble companions proven to be newly created by that operation. Preserve every pre-existing, symlinked, non-regular, non-AppleDouble, or provenance-uncertain `._*` path byte-for-byte; never use glob, recursive, `find -delete`, or bulk cleanup.
18. Treat user-facing `Delete` as reversible deletion by default. Keep deletion separate from suspension/archive status, require a Trash-only conditional purge, and plan every DynamoDB, Cognito, provider, projection, authorization, audit, and cache participant before implementing a resource lifecycle.
19. Require exact `development` mode, an authenticated actor, and exact `developer` membership for every developer capability. Repeat the gate at mutation boundaries, write explicit seed provenance and atomic markers, and garbage-collect through bounded marker queries rather than current fixture names or scans.
20. Alphabetize user-facing unordered chips, options, and tree siblings by displayed label; preserve explicit semantic sequences. Default `CiDataTable` to newest creation date first, and use the shared Core-duration `CiNewResourceBadge` for recently created resources. Page-header chips must have an icon and filled semantic background; omit redundant `Management enabled`/`Read only` chips.
21. Keep server-rendered client-component output hydration-stable. Resolve locale and time zone explicitly, pass the same serialized inputs to server and client, and never derive initial visible markup from host defaults, the current clock, randomness, or a browser-only branch.
22. Expose each management-page seeder through one top-level `Seeder` action. Put seed and cleanup choices inside its dialog, and require a separate destructive confirmation for cleanup.
23. Keep Amplify AppSync resolver functions that consume Data resources in the `data` resource group, even when they administer Cognito. Grant their Cognito access from Lambda-owned policies in the consumer stack; do not attach Data-stack resolver roles through `defineAuth(...access)`, because the Auth-owned policy creates the reverse nested-stack edge. Keep actual Cognito trigger functions in `auth`.
24. Keep domain JSON values and seeder fixtures structured. For Amplify `a.json()` fields, serialize exactly once when writing an AppSync `AWSJSON` variable and decode at the provider read boundary; cover every JSON-backed field together. Never fix an invalid-variable error by stringifying fixture files, weakening the domain type, or serializing before the provider boundary.

## Workflow

### 1. Understand the behavior

Identify:

- the externally visible behavior;
- the full request/build/runtime path involved;
- whether the behavior is reusable;
- whether it is generic, Next.js-specific, provider-specific, EmberGuard-specific, UI-specific, or application-specific;
- affected public contracts, configuration, and runtime boundaries.
- for persistence work, the bounded context, access patterns, consistency requirements, data lifecycle, expected item sizes and traffic, tenancy boundary, and failure impact.
- for deletion work, the soft-delete, restore, and purge participants; their transaction/idempotency boundary; and which provider locations are explicitly not applicable.

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
- existing `CiDataTable` definitions, configuration, mutation adapters, semantic feedback, and confirmation flows when the task touches a management table.
- active infrastructure registration, generated model/table binding, IAM grants, indexes, capacity mode, backup/TTL/stream behavior, and every call site when the task touches DynamoDB.
- the ownership lane of every affected template path, all manual and generated custom registries, and core/manual/generated key or path collisions when the task touches `apps/template` or generation.
- before any Codex or CloudIgniter create/generate operation on a macOS-capable filesystem, the exact intended output manifest and an `lstat`-based snapshot of existing candidate `._*` companions so later cleanup can prove current-operation provenance.

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

For template or generator work, apply the [template core/custom boundary](references/architecture/packages/template-core-custom-boundary.md). Existing template-local platform code is migration debt, not permission to add another exception.

### 4. Design the change

Before coding, determine:

- the owning package;
- the public entry point, if any;
- the direction of dependencies;
- the runtime boundary;
- compatibility impact;
- how the change affects the request lifecycle;
- the focused validation needed.

For DynamoDB work, also decide and record:

- why the data belongs in an existing bounded-context table or requires a new one;
- the exact `GetItem`, `Query`, write, transaction, and administrative access patterns;
- whether strong consistency is required and why a GSI is or is not safe;
- the request, storage, index-write, backup, stream, and replication cost drivers;
- the least-privilege IAM and tenant-isolation boundary;
- the migration, rollback, observability, and cost-guardrail plan.

Use [DynamoDB design](references/architecture/persistence/dynamodb.md) for the mandatory decision sequence. Verify volatile AWS
pricing and service behavior against current official AWS documentation before making a cost-sensitive choice.

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

For application-facing generation, implement the reusable compilers in their package owners, then use a provider-neutral CLI orchestrator and a confined file transaction. Write only to registered generated-owned paths inside the custom seams. Keep manual registries separate and fail on collisions or ownership ambiguity before applying any file.

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

Read the [Tenant request-lifecycle overview](references/architecture/tenants/overview.md) and its focused child references for the complete invariants and diagnostic sequence.

### 7. Validate and review

Run validation proportional to the affected scope. At minimum:

- typecheck the owning package;
- run focused tests;
- validate the public export when changed;
- validate at least one consuming layer;
- inspect the final diff for ownership, dependency, runtime, and lifecycle regressions;
- compare post-operation `._*` candidates only against the pre-snapshot and exact output manifest; remove an exact path only after verifying that it is a new, regular, non-symlink AppleDouble file with magic `0x00051607`, and preserve plus report every uncertain or failed cleanup candidate;
- run `graphify update .` after code or architecture-document changes.

For DynamoDB changes, validate access patterns without request-path scans, exact keys and conditions, pagination,
consistency, consumed-capacity observability, least-privilege grants, and the cost impact of every index and
optional feature. A change is not complete merely because a provider call succeeds.

If a broad check is already failing, distinguish related failures from baseline failures and report both honestly.

For a `CiDataTable` page, also complete the [data-table interaction review](references/architecture/ui/data-table.md). A
type-correct table is not complete when loading clears its structure, empty content collapses its headings,
conditional actions shift between rows, mutations are silent, or destructive actions use browser-native
confirmation.

Use [validation and final review](references/authoring/validation.md) for the final checklist.

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

Persistence:
<bounded context, access patterns, consistency, cost and safety decisions, when relevant>

Filesystem metadata:
<new proven AppleDouble companions removed, preserved candidates, and cleanup warnings, when files were created/generated>

Validation:
<checks performed and known unrelated blockers>
```
