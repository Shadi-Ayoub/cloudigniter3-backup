# Resource Studio V1 Development Contract

Use this reference for every Resource Studio change. Treat these rules as the V1 compatibility and safety contract, not merely as implementation notes.

## Table of contents

1. [Purpose and terminology](#1-purpose-and-terminology)
2. [Load the adjacent contracts](#2-load-the-adjacent-contracts)
3. [Keep capability ownership explicit](#3-keep-capability-ownership-explicit)
4. [Preserve the Data Entity and Amplify contract](#4-preserve-the-data-entity-and-amplify-contract)
5. [Generate only registered artifacts](#5-generate-only-registered-artifacts)
6. [Preserve frontend and Tenant-scope behavior](#6-preserve-frontend-and-tenant-scope-behavior)
7. [Plan and mutate fail-closed](#7-plan-and-mutate-fail-closed)
8. [Keep rollback claims exact](#8-keep-rollback-claims-exact)
9. [Separate generation from deployment and SSO](#9-separate-generation-from-deployment-and-sso)
10. [Defend the local Studio boundary](#10-defend-the-local-studio-boundary)
11. [Clean macOS AppleDouble artifacts by proven provenance only](#11-clean-macos-appledouble-artifacts-by-proven-provenance-only)
12. [Validate the complete V1 path](#12-validate-the-complete-v1-path)
13. [Keep V1 exclusions explicit](#13-keep-v1-exclusions-explicit)

## 1. Purpose and terminology

Use these terms consistently:

| Term            | Meaning                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| Resource Studio | The local browser tool that defines, generates, deploys, drops, and locally rolls back application resources. |
| Resource        | A unit managed by Resource Studio.                                                                            |
| Data Entity     | The schema-level definition of one application record type.                                                   |
| Data Record     | One stored instance of a Data Entity.                                                                         |
| Data Store      | The persistence resource behind a Data Entity.                                                                |
| Management Page | The generated administration page for a Data Entity.                                                          |

Expose Resource Studio to application developers through `ci resources studio`. Do not add a `ci-dev` generator: CloudIgniter maintainers implement platform-owned entities natively in the package that owns them.

## 2. Load the adjacent contracts

Also read the smallest relevant set of:

- [template-core-custom-boundary.md](template-core-custom-boundary.md) for every generated template path and composition seam;
- [cli-development.md](cli-development.md) for commands, browser orchestration, subprocesses, and deployment;
- [dynamodb-design.md](dynamodb-design.md) and [table-keys.md](table-keys.md) for models, indexes, access patterns, cost, and keys;
- [data-table.md](data-table.md) for the generated manager interaction contract;
- [public-api-and-runtime.md](public-api-and-runtime.md) for exports and client/server boundaries;
- [validation.md](validation.md) before completion.

## 3. Keep capability ownership explicit

Preserve this dependency and ownership split:

```text
packages/cli   → browser session, orchestration, file transactions, safe AWS commands
packages/aws   → descriptor normalization, Amplify capabilities and schema planning
packages/next  → scoped page, server-action and route planning
packages/ui    → reusable CiDataEntityManager and CiDataTable presentation
packages/core  → canonical keys, route contracts and strict merge helpers
apps/template  → thin composition plus application-owned generated output
```

Do not import template source from a package or move provider/framework compilers into the provider-neutral CLI. Keep application output under `amplify/custom`, `src/custom`, or a scoped `(ci-custom)` route tree. Treat existing template-local platform behavior as migration debt, never as permission for another exception.

## 4. Preserve the Data Entity and Amplify contract

Normalize every descriptor to schema version `1`, kind `data-entity`, and provider `aws-amplify`. Require a stable lowercase kebab-case resource ID, PascalCase singular and plural names, `tenant` or `global` scope, and a static absolute logical management path.

V1 creates one Amplify-managed `a.model(...)` Data Store per Data Entity. Supply and reserve:

- `PK` and `SK` as `identifier(["PK", "SK"])`;
- `id` as the application record identifier;
- `ciScopeKey` and `ciSortKey` for bounded listing;
- Amplify-managed `createdAt` and `updatedAt` timestamps.

Accept the Amplify scalar catalog exposed by `CI_AWS_RESOURCE_STUDIO_CAPABILITIES`: `ID`, `String`, `Int`, `Float`, `Boolean`, `AWSDate`, `AWSTime`, `AWSDateTime`, `AWSTimestamp`, `AWSEmail`, `AWSJSON`, `AWSPhone`, `AWSURL`, and `AWSIPAddress`. Preserve required, array, array-item-required, supported default, and type-compatible validation semantics. Reject duplicate or reserved custom fields.

Support model authorization strategies `authenticated`, `guest`, `publicApiKey`, `owner`, `ownerDefinedIn`, `ownersDefinedIn`, `group`, `groups`, `groupDefinedIn`, `groupsDefinedIn`, and `custom`, with only compatible providers, claims, fields, groups, and operation subsets. When no rule is supplied, use the V1 administration default: all CRUD operations for `system-admin` and `system-super-admin`. Treat route scope and model authorization as separate controls.

Always reserve the `byScope` GSI over `ciScopeKey` and `ciSortKey` and list through its named, paginated Query. Never generate a request-path Scan. Permit at most 19 additional GSIs, require each to serve a named access pattern, and validate key types, names, query fields, projections, and included attributes. Document eventual consistency, write/storage cost, and possible sandbox table replacement for every index change.

Build persisted keys only with CloudIgniter's canonical `CI#...` helpers. Do not accept a Tenant ID or system key from the browser.

## 5. Generate only registered artifacts

For entity `<id>`, generate backend source only at:

```text
amplify/custom/data/schemata/data-entities/<id>/entity.ci.json
amplify/custom/data/schemata/data-entities/<id>/schema.generated.ts
amplify/custom/data/schemata/registry.generated.ts
```

Generate frontend source only at:

```text
src/app/(ci-tenant)/ci-tenant/(ci-custom)/<logical-path>/
src/app/(ci-global)/ci-global/(ci-custom)/<logical-path>/
  page.tsx
  Ci<Plural>Manager.tsx
  actions.generated.ts

src/custom/routes/resource-studio.generated.ts
```

Treat `entity.ci.json` as the portable source for later edits. Sort descriptors deterministically and rebuild shared generated registries from the complete descriptor set. Never edit or patch generated output manually; change the descriptor and re-plan it. Keep manual custom registries separate from generated registries.

## 6. Preserve frontend and Tenant-scope behavior

Suggest `/dashboard/<plural-kebab-case>` as the management path but allow another static logical path. Reject route parameters, trailing slashes, `(system)`, internal `/ci-tenant` or `/ci-global` prefixes, and public `/t/...` prefixes. Require logical route uniqueness across both scopes.

Place a Tenant entity under `(ci-tenant)/ci-tenant/(ci-custom)` and a Global entity under `(ci-global)/ci-global/(ci-custom)`. Generate a protected route with the matching `tenantScopes` restriction. Recheck the resolved scope in the page and every server action.

Generate native Amplify Data create, get, update, delete, and named-GSI list calls. Build IDs and keys on the server, cap pagination, normalize thrown errors, and return serializable mutation results. Do not confuse model operations with DynamoDB `SET` or `PUT` terminology.

Generate `Ci<Plural>Manager.tsx` beside the page. It must use `CiDataEntityManager` and render `CiDataTable`, while preserving shared loading, empty, mutation-feedback, confirmation, responsive, accessibility, and action-stability conventions.

## 7. Plan and mutate fail-closed

Before preparing a transaction:

1. Normalize every descriptor and create the complete deterministic AWS and Next.js plan.
2. Inspect core, manual-custom, and other generated reservations.
3. Reject duplicate resource IDs, model names, logical routes, list-query names, and output paths.
4. Confine every path to its registered generated root.
5. Reject absolute paths, traversal, NULs, unsafe separators, symlink traversal, non-regular targets, unowned existing files, and generated-file drift.
6. Calculate all creates, replacements, and deletions before writing anything.

When a planner version expands the generated artifact closure for existing descriptors, implement an explicit versioned output migration that can reconstruct the known prior plan. Treat expected absence of an artifact newly introduced by that migration as a create, not as drift. If that target already exists without proven generated ownership, fail with an ownership collision and never adopt it.

Apply create, update, and drop through one confined journaled file transaction. Keep the descriptor ID immutable. Treat Drop as a new forward transaction that removes entity-owned artifacts and regenerates shared registries; it is not transaction undo.

## 8. Keep rollback claims exact

Store exact before- and after-images, modes, and created directories under `.cloudigniter/local/resource-studio/transactions`. Use atomic replacement. Before rollback changes any target, verify every tracked after-image. On any drift, report all conflicts and change nothing.

Undo applied transactions in last-in, first-out order. Restore previous bytes and modes, recreate deleted files, remove transaction-created files, and remove only transaction-created directories that remain empty. Keep the journal private and ignored.

Describe this only as exact local-file rollback. It does not restore AWS, CloudFormation state, DynamoDB records, SSO state, caches, dependencies, or files outside the transaction. Reconcile a deployed definition through a separately reviewed compensating deployment. Require an independent export, migration, backup, and restore plan for valuable data.

## 9. Separate generation from deployment and SSO

Keep create, update, drop, and undo offline. Never start Amplify because a local form was submitted.

For deployment:

1. Require an explicit AWS profile and valid 1–15 character sandbox identifier.
2. Verify that generated-owned files match the deterministic plan and hash the sorted path/content plan.
3. Run STS and resolve Region from `AWS_REGION`, then `AWS_DEFAULT_REGION`, then the selected profile; fail when none exists.
4. Issue a 10-minute, single-use, in-memory intent bound to plan hash, profile, identifier, account, ARN, user ID, and Region.
5. Show the exact verified target before an interactive deployment.
6. Consume the intent, rebuild and hash the plan, repeat STS and Region resolution, and reject every mismatch or expiry before spawning Amplify.
7. Pin the verified Region as both `AWS_REGION` and `AWS_DEFAULT_REGION` and run one `ampx sandbox --once` process.

After `aws sso login`, automatically repeat STS/Region verification and issue a fresh intent; login success alone never authorizes deployment. Make `ci amplify sandbox deploy --profile=... --identifier=... --no-interactive` use the same verification runtime. Support deployment only on Node.js 22 and 24 in V1 while leaving offline editing available under other runtimes.

## 10. Defend the local Studio boundary

Bind only to `127.0.0.1` and reject non-loopback clients and unexpected hosts. Use a one-use five-minute bootstrap token in the URL fragment, exchange it for an `HttpOnly`, `SameSite=Strict` session with a fixed eight-hour lifetime, and require exact Origin plus CSRF proof for mutations. Serialize mutation operations, cap JSON request bodies, and send no-store, CSP, framing, referrer, and content-type security headers. Never expose Studio through a public tunnel.

Keep settings, lifecycle logs, and journals in private ignored `.cloudigniter/local` files. Never persist AWS credentials, Studio bootstrap/session secrets, or deployment intents. Redact credential-bearing object keys and secrets embedded in strings, including authorization values, access keys, JWTs, API keys, and complete, unterminated, or chunk-split PEM blocks, before persistence. Treat redaction as defense in depth rather than permission to log sensitive payloads.

## 11. Clean macOS AppleDouble artifacts by proven provenance only

Treat every `._*` path as user-owned unless the current operation proves otherwise. A name match alone is never proof.

Apply this contract to every create, update, drop, undo, and failure-recovery path. Build the cleanup manifest as the exact union of:

- every generated file the operation will create, replace, restore, or delete;
- every directory the tool will create or later attempt to remove;
- every atomic temporary file name allocated by the operation;
- the exact machine-local writers `.cloudigniter/local/.gitignore`, `.cloudigniter/local/resource-studio/settings.json`, `.cloudigniter/local/resource-studio/lifecycle.jsonl`, and every file written below `.cloudigniter/local/resource-studio/transactions/<transaction-id>/**`;
- the separate cleanup-provenance journal file itself.

Keep this cleanup manifest and journal out of generated ownership, resource descriptors, resource transaction before/after images, and the deployment plan hash. Pre-existing sidecars are never generated targets or transaction targets. They remain user-owned and may legitimately prevent an otherwise empty directory from being removed.

Before Resource Studio or Codex creates or generates files:

1. Materialize the exact intended output manifest; do not infer it afterward from a directory walk.
2. Derive only the possible AppleDouble companion for each manifest path: for `<parent>/<name>`, the candidate is `<parent>/._<name>`.
3. Snapshot each candidate with `lstat`, recording absence or its exact path, file kind, mode, size, device/inode identity, modification time, and SHA-256 when it is a readable regular file. Preserve every existing candidate byte-for-byte.
4. Start a separate private cleanup-provenance journal for this operation. Bind the canonical application-root identity and operation ID to the exact output manifest, derived candidates, pre-snapshots, atomic temporary names, and later per-output write result. For a transaction-backed operation, use a distinct journal file below that transaction's machine-local directory rather than adding cleanup entries to its resource before/after-image journal.

If the manifest, pre-snapshot, or cleanup journal cannot be established before mutation, do not reconstruct provenance afterward and do not remove any companion. Continue only with cleanup disabled and an explicit warning, or fail the create/generate operation before it writes.

After the current mutation or recovery step, inspect only candidates derived from that same manifest. An exact candidate may be removed only when all of these conditions hold:

- it was absent in the pre-snapshot;
- the current operation successfully completed the exact declared create, replace, restore, delete, directory, or atomic-temporary-file action corresponding to that manifest entry;
- the cleanup-provenance journal binds the candidate to this operation and output;
- `lstat` shows a regular file and not a symbolic link;
- its first four bytes, read without following links, are the big-endian AppleDouble magic number `0x00051607`;
- no post-generation fact makes provenance uncertain.

Unlink each proven candidate by its exact path. Never use a glob, recursive deletion, `find -delete`, wildcard expansion, or bulk cleanup. Never delete a pre-existing candidate, a directory, symlink, socket, non-AppleDouble file, companion for an output not in the exact manifest, or any path whose provenance is incomplete. Preserve uncertain candidates byte-for-byte and emit an actionable warning. A cleanup failure must not be hidden or reclassified as successful cleanup; retain the provenance journal and report the exact candidate and reason.

Run proven sidecar cleanup before the transaction attempts to remove tool-created empty directories. After cleanup, use ordinary empty-directory removal and accept a retained pre-existing or uncertain sidecar as a reason the directory must remain. Never broaden deletion to make directory removal succeed.

For crash or failure recovery, resume only from a complete, fsynced cleanup journal whose application root, operation ID, manifest path, derived candidate, absent pre-snapshot, corresponding committed output result, and recorded candidate fingerprint all match current `lstat` state. Reject a changed, partial, corrupt, reused, or mismatched journal; preserve every candidate and warn. Mark each exact unlink durably so retry is idempotent, and never infer recovery provenance from a surviving generated file alone.

Apply the same fail-closed process to files created directly by Codex. For a CloudIgniter generator, keep the detailed cleanup policy in that tool's development reference and test its manifest/provenance adapter. Do not scan or “tidy” unrelated pre-existing `._*` files discovered nearby.

## 12. Validate the complete V1 path

Run proportional package and consumer checks, including:

- AWS descriptor, scalar/default/validation, authorization, index, schema, warning, and collision tests;
- Next.js scoped paths, protected route metadata, server scope/key reconstruction, serializable CRUD/list results, and manager generation tests;
- UI field conversion plus `CiDataEntityManager`/`CiDataTable` interaction tests;
- CLI create, update, drop, reservation, ownership, generated drift, unsafe path, and symlink tests;
- versioned planner/output migration tests proving that a known prior plan accepts the expected absence of newly introduced artifacts, generates them, and still rejects an existing unowned target;
- exact transaction restoration of bytes, modes, created/deleted files and directories, LIFO undo, and all-or-nothing rollback drift tests;
- loopback, Host, bootstrap expiry/single use, fixed session expiry, Origin, CSRF, request-size, and security-header tests;
- plan-hash and deployment-intent binding, expiry, single use, SSO re-verification, Region precedence/drift/pinning, Node guard, and log-redaction tests, including complete, unterminated, and chunk-split PEM input;
- a real `Book` fixture that generates backend/frontend artifacts and proves drop plus exact local undo without contacting AWS;
- strict route/schema composition, package typechecks and exports, a template consumer check, CLI `npm pack --dry-run`, documentation checks, `git diff --check`, and `graphify update .`.

For AppleDouble cleanup, test at least:

- a pre-existing valid `._*` file remains byte-for-byte unchanged;
- a newly created, manifest-derived, provenance-journaled regular AppleDouble companion is removed by exact path;
- a newly observed `._*` outside the manifest is preserved;
- a regular `._*` file with the wrong or truncated magic is preserved;
- a symlink, directory, socket, changed-after-snapshot candidate, and provenance-journal mismatch are preserved and warned;
- a missing/incomplete pre-snapshot or journal and a companion beside a failed output write are preserved and warned;
- a crash-recovery candidate with a changed, corrupt, reused, or mismatched journal is preserved and warned;
- a pre-existing sidecar is excluded from transaction ownership and is allowed to block empty-directory removal without being deleted;
- proven current-operation sidecars are cleaned before empty-directory removal, including create, update, drop, undo, and failed-operation recovery;
- filenames with spaces, Unicode, and leading punctuation are handled without shell expansion;
- partial inspection or unlink failure reports exact warnings and does not trigger broader cleanup;
- repeated cleanup is idempotent and never adopts a pre-existing artifact.

Do not contact AWS in ordinary tests. If a broad repository check has baseline failures, separate them from change-related failures and report both accurately.

## 13. Keep V1 exclusions explicit

Do not expand V1 to:

- attach to an arbitrary existing or shared DynamoDB table;
- modify a hand-written or CloudIgniter core model;
- generate CRUD Lambda functions when native Amplify Data operations suffice;
- generate the Lambda needed by `custom` authorization;
- generate EmberGuard resources or policies;
- provide a production deployment workflow;
- expose a `ci-dev` generator;
- claim exact cloud-resource or Data Record rollback.

Treat any exclusion change as a separately designed versioned capability with ownership, migration, security, cost, and compatibility review.
