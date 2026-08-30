# Validation and Final Review

Use this reference before completing a non-trivial CloudIgniter change.

## Select validation by scope

Consider:

- focused unit or integration tests;
- TypeScript checks for every changed package;
- package lint/style checks;
- package builds;
- application typecheck/build;
- targeted runtime requests;
- package dry-run validation;
- client/server boundary scans;
- module validation;
- Graphify update.

When a public package API changes, validate the owner and at least one consumer. For EmberGuard work, validate the affected portion of:

```text
emberguard → core → next → provider → apps/template
```

For request-lifecycle or i18n work, validate the affected portion of:

```text
next.config.ts → proxy → context transport → request.ts → messages → provider/component
```

## Request lifecycle checks

- Does the proxy matcher include every application route that requires context?
- Are internal/static/API exclusions intentional?
- Is tenant/org-unit resolution performed before logical route matching?
- Can `route: null` reach a registered application page unexpectedly?
- Is the same-request header injected after route resolution?
- Are caller-supplied context headers removed before authoritative injection?
- Is cookie transport required, minimal, size-safe, and correlated with a pathname?
- Do redirects account for the loss of forwarded request headers?
- Does next-intl still point to the intended request configuration file?
- Does the route namespace load the expected message file chain?
- Are application overrides merged after core messages?

## CiDataTable interaction checks

Apply these checks to every new or changed management page built around `CiDataTable`:

- Do headings and column widths remain stable with no rows and while loading?
- Does loading preserve current data and cover only the table/card surface with readable live-status text?
- Does empty content span the body beneath the headings and distinguish empty data from filtered results?
- Do conditional row actions use stable ordering and `reserveSpace` where needed instead of fake disabled icons?
- Are icon-only controls named, keyboard reachable, focus visible, and at least 44 by 44 CSS pixels?
- Do mutations expose pending, semantic success, and error feedback through shared components?
- Do destructive or high-impact actions use `CiAlertDialog` rather than browser-native dialogs?
- Can persisted filters, search, or paging hide a newly created record after refresh? If so, is that state reset or
  intentionally not persisted?
- Do table, compact, and card formats preserve the same information and action availability?
- Were responsive widths, dark mode, keyboard use, and RTL reviewed where applicable?

Use the [data-table interaction contract](../architecture/ui/data-table.md) for the complete standard.

## Architectural diff review

Check:

- reusable logic did not remain in the template;
- every public type has the correct owner and `/types` export;
- public helpers use the correct `/client`, `/server`, or `/lib` entry point;
- generic EmberGuard APIs remain behind `core`;
- provider-specific behavior did not leak into generic packages;
- no package imports from `apps/template`;
- no accidental deep imports or duplicate abstractions;
- no client/server boundary was crossed;
- request context remains request-specific and minimal;
- compatibility impact is understood and documented.
- every template path has an explicit core, manual-custom, generated-custom, or machine-local owner;
- new application code is confined to `amplify/custom`, `src/custom`, or a scoped `(ci-custom)` route tree;
- template-core bridges contain only strict composition/delegation and no user business logic;
- generators touch only registered generated-owned folders/registries and fail on all core/manual/generated key or path collisions;
- local generator rollback is not represented as cloud-resource or data rollback.

For an explicit generated-resource deployment, also verify that:

- headless invocation requires the profile and provider deployment identifier;
- the preflight intent is short-lived, single-use, and bound to the exact generated-plan hash, profile, identifier, provider account/caller identity, and Region;
- plan, selection, identity, and Region are all recomputed or rechecked immediately before the provider subprocess, with drift and expiry failing before any mutation;
- the verified Region is pinned into the provider subprocess rather than re-resolved implicitly;
- SSO refresh automatically performs a fresh preflight but never deploys by itself;
- bootstrap/session lifetimes are finite and credential-like structured values and strings are redacted from persisted lifecycle logs.

For table persistence changes, also verify that every new or changed PK, SK, and secondary-index key uses the
core builders, starts with `CI#`, and has exact-string tests. Before production, verify that an atomic cutover
leaves no legacy lookup or write path. For retained deployed data, verify the explicit migration strategy. Read
[table-key convention](../architecture/persistence/table-keys.md) for the complete convention.

For DynamoDB architecture or interaction changes, also verify that the bounded-context decision, named access
patterns, consistency behavior, IAM boundary, index write amplification, capacity/storage assumptions, optional
feature costs, migration, and observability are documented. Reject request-path scans, unbounded queries, GSIs
used as authorization proof, and table splits or combinations justified only by table count. Read
[DynamoDB design reference](../architecture/persistence/dynamodb.md) for the complete review.

## Baseline failures

If a broad repository check fails:

1. Record the command and failure.
2. Determine whether any failure references changed code.
3. Run narrower checks that can validate the changed scope.
4. Do not claim the broad check passed.
5. Report unrelated baseline blockers separately from change-related failures.

## Completion report

Include ownership, affected lifecycle stages, public API, template impact, compatibility, validation performed, and any known unrelated blocker.
