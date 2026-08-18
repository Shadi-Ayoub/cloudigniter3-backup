---
name: cloudigniter-development
description: Apply CloudIgniter architecture and ownership conventions, including Resource Studio and Data Entity planners, generated backend/frontend artifacts, collision-safe create/update/drop/undo transactions, local Studio security, AWS SSO/STS verification and one-shot Amplify sandbox deployment, macOS AppleDouble cleanup safety, DynamoDB persistence and table keys, Next.js routing and rendering, access control, CiDataTable management pages, public APIs, runtime boundaries, and validation. Use when implementing, debugging, refactoring, reviewing, or documenting CloudIgniter code in packages/cli, packages/core, packages/emberguard, packages/next, packages/aws, packages/ui, apps/template, or the developer guide.
---

# CloudIgniter Development Workflow

Use this skill for development work in the CloudIgniter repository. Treat `AGENTS.md` as mandatory and this skill as its implementation workflow.

## Load only the relevant references

Read every reference selected for the task completely before changing code.

- Read [architecture-overview.md](references/architecture-overview.md) for repository architecture, dependency direction, and the template-versus-package boundary.
- Read [package-ownership.md](references/package-ownership.md) when deciding whether work belongs in `core`, `emberguard`, `next`, a provider package, `ui`, or the template.
- Read [template-core-custom-boundary.md](references/template-core-custom-boundary.md) whenever work changes or generates files in `apps/template`, adds an application extension seam, or designs an application-facing generator.
- Read [resource-studio.md](references/resource-studio.md) whenever work implements, changes, reviews, diagnoses, or documents Resource Studio; a Data Entity descriptor or capability; AWS, Next.js, or UI generation; generated schemas, scoped management pages/actions/routes; the Studio browser/server/session API; create/update/drop/undo transactions; AWS SSO/STS preflight; or one-shot Amplify sandbox deployment.
- Read [request-lifecycle.md](references/request-lifecycle.md) whenever work touches or depends on `next.config.ts`, `proxy.ts`, routing, tenant/org-unit resolution, request context, redirects/rewrites, bootstrapping, next-intl, locale messages, request headers, or request cookies.
- Read [page-rendering.md](references/page-rendering.md) whenever work touches the root layout, route-group layouts, page components, `appBootstrap()`, `appResolveRootLayoutContext()`, `AppRootWrapper`, `CiLayout`, `CiPageWrapper`, `CiClientWrapper`, `CiPage`, or their provider hierarchy.
- Read [public-api-and-runtime.md](references/public-api-and-runtime.md) when adding or changing public types, exports, modules, package dependencies, or client/server code.
- Read [emberguard.md](references/emberguard.md) for authentication, authorization, actors, sessions, roles, permissions, policies, claims, or provider binding.
- Read [access-control.md](references/access-control.md) when defining or changing authorization catalogs, resources, actions, privileges, scopes, assignments, combining algorithms, role inheritance, core roles, identity-group mappings, access-control override policy, or security-administration role and privilege selectors.
- Read [dynamodb-design.md](references/dynamodb-design.md) whenever work proposes, creates, combines, splits, renames, reads, writes, queries, indexes, migrates, secures, monitors, or documents a DynamoDB table or persisted DynamoDB record.
- Read [table-keys.md](references/table-keys.md) whenever work creates, changes, migrates, reads, writes, queries, or documents table `PK`, `SK`, or secondary-index key values.
- Read [data-table.md](references/data-table.md) whenever work creates, changes, reviews, or diagnoses a page built around `CiDataTable`, including columns, loading and empty states, row/global actions, mutation feedback, confirmations, filters, persistence, responsive formats, or provider-backed refresh behavior.
- Read [cli-development.md](references/cli-development.md) whenever work adds, changes, migrates, documents, publishes, or reviews `@cloudigniter/cli`, the `ci` or `ci-dev` executables, command flags, prompts, subprocesses, terminal output, exit codes, or package scripts that invoke the CLI.
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
9. Treat the `CiDataTable` interaction contract as a cross-page consistency requirement, not page-local styling.
10. Build CloudIgniter-owned table keys with the public core helpers; never introduce a new manually concatenated PK, SK, or secondary-index key.
11. Use bounded-context tables: combine related entity types only when their access patterns, security boundary, lifecycle, and operational profile align. Never default to one platform-wide table or one table per entity.
12. Treat every new table, index, scan, stream, replica, backup mode, capacity-mode change, and consistency choice as a cost and safety decision. Document the access pattern and cheaper safe alternative before implementing it.
13. Keep application/system commands under `ci` and monorepo-only commands under the workspace-gated `ci-dev` executable; share infrastructure through `packages/cli` without mixing their help trees.
14. Keep application-owned implementation only in `amplify/custom`, `src/custom`, and scoped `(ci-custom)` route trees. Template-core files may bridge custom inputs only through thin, strict composition; reusable code belongs in packages.
15. Let generators rewrite only registered generated-owned resource folders and generated registries. Reject every core/manual/generated key or path collision before mutating files, and never silently adopt or overwrite hand-written code.
16. Keep local generation and cloud deployment separate. A generated-resource deployment requires an explicit target, a short-lived single-use intent bound to the exact generated plan and verified provider identity/Region, and a complete recheck immediately before the provider subprocess.
17. Treat macOS `._*` files as ownership-sensitive metadata. Record exact pre-existing artifacts and intended outputs before Codex or a CloudIgniter tool creates or generates files, then remove only exact AppleDouble companions proven to be newly created by that operation. Preserve every pre-existing, symlinked, non-regular, non-AppleDouble, or provenance-uncertain `._*` path byte-for-byte; never use glob, recursive, `find -delete`, or bulk cleanup.

## Workflow

### 1. Understand the behavior

Identify:

- the externally visible behavior;
- the full request/build/runtime path involved;
- whether the behavior is reusable;
- whether it is generic, Next.js-specific, provider-specific, EmberGuard-specific, UI-specific, or application-specific;
- affected public contracts, configuration, and runtime boundaries.
- for persistence work, the bounded context, access patterns, consistency requirements, data lifecycle, expected item sizes and traffic, tenancy boundary, and failure impact.

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

For template or generator work, apply [template-core-custom-boundary.md](references/template-core-custom-boundary.md). Existing template-local platform code is migration debt, not permission to add another exception.

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

Use [dynamodb-design.md](references/dynamodb-design.md) for the mandatory decision sequence. Verify volatile AWS
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

Read [request-lifecycle.md](references/request-lifecycle.md) for the complete invariants and diagnostic sequence.

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

For a `CiDataTable` page, also complete the interaction review in [data-table.md](references/data-table.md). A
type-correct table is not complete when loading clears its structure, empty content collapses its headings,
conditional actions shift between rows, mutations are silent, or destructive actions use browser-native
confirmation.

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

Persistence:
<bounded context, access patterns, consistency, cost and safety decisions, when relevant>

Filesystem metadata:
<new proven AppleDouble companions removed, preserved candidates, and cleanup warnings, when files were created/generated>

Validation:
<checks performed and known unrelated blockers>
```
