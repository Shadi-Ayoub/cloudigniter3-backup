# Access-Control Logic and Strategy

Use this reference for CloudIgniter authorization catalogs, policy evaluation, scopes, assignments, role design, provider mappings, and protected core overrides.

## Table of contents

1. Model and ownership
2. Evaluation strategy
3. Configuration strategy
4. Scope strategy
5. Role design
6. Core role lanes
7. Catalog composition and overrides
8. Provider and enforcement strategy
9. Security administration UI strategy
10. Validation checklist

## Model and ownership

Treat CloudIgniter authorization as provider-neutral, scoped ARBAC:

```text
subject + scoped assignments
        + resource/action request
        + authoritative runtime scope
        ↓
compiled access-control catalog
        ↓
auditable allow/deny decision
```

- Define stable domains, resources, actions, roles, and privileges in the catalog.
- Require every domain, action, role, and privilege ID—including core role IDs—to use lowercase kebab case; reserve lowercase dotted segments for resource capability IDs.
- Give every privilege a stable `id` and a required, human-readable `title`; use the title in forms and displays while retaining the ID for persistence and audit evidence.
- Treat resource-domain status as additive policy state: omitted means `active`; a suspended domain causes every resource in it to fail authorization with `suspended-domain` while preserving the catalog for restoration.
- Treat resource status as the child policy gate: omitted means `active`; a suspended resource fails with `suspended-resource` while preserving its actions, scopes, privileges, and domain relationship. Evaluate domain status first, so `suspended-domain` wins when both levels are suspended.
- Keep generic evaluation algorithms inside `packages/emberguard`.
- Expose supported helpers and public contracts through `@cloudigniter/core/lib` and `@cloudigniter/core/types`.
- Adapt provider groups and claims in the provider package, then normalize them into generic assignments.
- Resolve the authoritative subject and scope in the framework/runtime layer.
- Keep application catalog extensions and provider mappings in application configuration.

Model resources as business or platform capabilities such as `identity.users` or `platform.settings`, not as URLs. Enforce the same resource/action at every relevant page, server operation, resolver, job, and UI capability boundary.

## Evaluation strategy

Evaluate in this order:

1. Reject an unauthenticated subject when the capability requires authentication.
2. Reject unknown resources and actions.
3. Deny a resource in a suspended domain with `suspended-domain`.
4. Deny a suspended resource with `suspended-resource`.
5. Select active direct privileges and role assignments whose time bounds and scopes match.
6. Exclude suspended roles before expansion; they grant nothing and do not bridge inherited privileges.
7. Expand active role inheritance and retain both the assigned role and privilege-owning role as decision evidence.
8. Match resource and action patterns.
9. Apply the configured combining algorithm.
10. Deny when no applicable privilege allows the request.

Use `deny-overrides` by default. Any matching deny defeats matching allows. Use `highest-precedence` only when the strongest applicable assigned role is intentionally authoritative; within the selected tier, deny still overrides allow. Treat direct subject privileges as the strongest tier in highest-precedence mode.

Keep these concepts separate:

- **Inheritance** composes privileges between roles.
- **Precedence** resolves conflicts between assigned roles; a lower number is stronger.
- **Scope** limits where an assignment applies.
- **Propagation** determines whether an assignment reaches descendants.

Never infer inheritance or scope from precedence.

## Configuration strategy

Expose application-wide EmberGuard policy settings beneath `auth.emberguard` in `cloudigniter.config.ts`:

```ts
auth: {
  emberguard: {
    accessControl: {
      combiningAlgorithm: "deny-overrides",
    },
  },
}
```

- Own the public configuration contracts in `packages/core` and export them through `@cloudigniter/core/types`.
- Keep the configuration provider-neutral; do not add Cognito, Next.js, or persistence details to it.
- Pass `auth.emberguard.accessControl` to the application authorizer during application composition.
- Preserve `deny-overrides` as the authorizer default when `combiningAlgorithm` or the complete `emberguard` block is omitted.
- Add future EmberGuard settings beneath focused subkeys rather than mixing authorization fields with authentication UI fields.
- Document and test any new setting at the core type boundary and at least one application consumer.

## Scope strategy

Use the narrowest assignment that expresses the responsibility:

| Scope     | Intended boundary                                            |
| --------- | ------------------------------------------------------------ |
| `system`  | CloudIgniter platform operation and bootstrap administration |
| `global`  | Cross-tenant application responsibility                      |
| `tenant`  | One tenant                                                   |
| `orgUnit` | One Org Unit within a tenant                                 |

- Use `exact` when an assignment applies only at its declared boundary.
- Use `descendants` only when access must flow to lower scopes.
- Require authoritative ancestor IDs before treating an Org Unit as a descendant.
- Keep global and system scopes separate; neither implies the other.
- Treat identity-provider membership as assignment input, not proof that an arbitrary requested scope is valid.
- Do not use client-controlled cookies, headers, or route parameters as authorization evidence without server-side resolution and validation.

## Role design

Design roles around stable responsibilities rather than people, screens, or temporary teams. Prefer focused roles that can be assigned together over one broad role spanning unrelated duties.

Use inheritance only for a real responsibility hierarchy. Do not use it merely to deduplicate a privilege shared by unrelated roles. Keep inheritance acyclic and within one catalog.

For custom application roles:

- inherit the narrowest suitable core or application role;
- follow the catalog-wide lowercase kebab convention for role and privilege IDs;
- assign explicit privileges for the additional responsibility;
- use stable role and privilege IDs because they appear in persistence and audit evidence;
- use concise privilege titles that describe the granted or denied capability to administrators;
- avoid wildcards for sensitive capabilities unless broad access is deliberate and reviewed;
- separate business administration, technical operations, support, audit, and emergency access;
- test both the intended allow path and a nearby denial path.

Treat `status` as additive policy state: omitted means `active`; `suspended` requires actor, timestamp, and reason
metadata for the latest transition. Keep assignments intact during suspension so restoration is explicit and
reversible. Do not add automatic restoration, and never permit `system-super-admin` to be suspended.

## Core role lanes

Keep business administration and technical platform administration as separate inheritance lanes:

```text
user
├── developer
├── admin
│   └── super-admin
└── system-admin
    └── system-super-admin
```

| Role                 | Responsibility                                                                          | Inherits       |
| -------------------- | --------------------------------------------------------------------------------------- | -------------- |
| `user`               | Base authenticated application access                                                   | —              |
| `developer`          | Developer tooling                                                                       | `user`         |
| `admin`              | Business administration within global, tenant, or Org Unit scopes                       | `user`         |
| `super-admin`        | Elevated business administration                                                        | `admin`        |
| `system-admin`       | Technical platform settings, tenant infrastructure, and system access-control operation | `user`         |
| `system-super-admin` | Technical bootstrap, break-glass, and protected core-policy administration              | `system-admin` |

Preserve these invariants:

- `system-admin` must not inherit `admin` or `super-admin`, directly or transitively.
- `system-super-admin` may inherit `system-admin`, but no other role may inherit `system-super-admin`.
- A directly assigned, system-scoped `system-super-admin` is required for a protected core access-control override.
- A direct privilege or inherited application role must not substitute for that bootstrap assignment.
- Precedence remains a conflict-resolution order and does not merge the technical and business lanes.

When one person needs both technical and business duties, assign roles from both lanes at the appropriate scopes. Do not join the lanes by changing core inheritance. This keeps grants, reviews, and revocation explicit.

## Catalog composition and overrides

Treat `CI_DEFAULT_ACCESS_CONTROL_DEFINITION` as immutable core policy.

- Import the initial persisted definition through `@cloudigniter/core/lib`. If the canonical active-state item is
  absent, initialize it conditionally from that definition at deployment bootstrap and on the first runtime read;
  never overwrite an existing state. Rebuild initial counters from any retained assignment collection before the
  create-only write. Use a single conditional `PutItem`, not a transaction, because initialization changes only
  one item. Local bootstrap must invoke the deployed access-control handler. Prefer the handler name in
  application outputs; if the provider omits it, accept only a uniquely discovered get-definition handler whose
  runtime configuration names the exact access table. Do not query the table with a developer SSO identity or
  widen that identity's DynamoDB permissions for seeding.
- Add application domains, resources, actions, roles, and privileges through `ciCreateAppAccessControl()`.
- Do not redefine core-owned entries from an application layer.
- Create an application role that inherits an eligible core role when extending a core responsibility.
- Never let an application role inherit `system-super-admin` or grant `platform.authorization.core.override`.
- Use `ciCreateCoreAccessControlOverride()` only for a deliberate, audited core change.
- Preserve the technical/business administrator separation and the `system-super-admin` bootstrap path across overrides.
- Persist override history immutably with conditional, consecutive revisions and step-up authentication in the provider adapter.
- Build every access-control PK, SK, and secondary-index key with the CloudIgniter core table-key helpers and follow [table-keys.md](table-keys.md) for namespace, segment, and migration rules.
- On persisted-catalog reads, migrate only an absent legacy privilege `title` from the matching configured catalog entry or, for an unknown custom entry, a deterministic label derived from its stable ID before validation.
- Never normalize role IDs. Definitions, inheritance references, assignments, identity-provider groups, seed data, and integrations must all use the canonical lowercase kebab IDs and fail fast otherwise.
- Validate resource-domain IDs with the same lowercase kebab convention. Require actor, timestamp, and reason metadata for suspension, and never permit suspension of the `platform` recovery domain.
- Require actor, timestamp, and reason metadata for resource suspension. Never permit suspension of `platform.authorization` or `platform.authorization.core`; these resources preserve administration and break-glass recovery. Restoring a resource does not override a suspended parent domain.
- Do not repair explicitly blank or malformed titles, and validate every catalog write strictly. The read migration is compatibility behavior, not permission-policy normalization.

## Provider and enforcement strategy

- Map identity-provider groups to stable lowercase kebab role IDs through explicit configuration, and treat provider group membership changes as an operator migration.
- Keep the catalog authoritative for privileges and precedence; do not duplicate policy in provider groups.
- Grant `system-admin` and `system-super-admin` only to technical administrators through controlled, auditable workflows.
- Grant `admin` and `super-admin` for application-business administration at global, tenant, or Org Unit scopes as intended.
- Minimize standing `system-super-admin` access and use it as protected bootstrap or break-glass authority.
- Re-resolve provider membership and persisted assignments on trusted server boundaries before sensitive mutations.
- Return and retain authorization decision evidence for diagnostics and audit without exposing secrets.

## Security administration UI strategy

Use a search-first chip multi-select when a form selects multiple roles, privileges, scopes, or similar catalog entries.

- Treat role `permissionCount`, `directUserCount`, and `inheritedUserCount` as a persisted, mutation-maintained
  administration projection. Never query or scan role assignments while rendering the role table.
- Rebuild affected role counters after every definition mutation, including role create/update/delete,
  privilege changes, inheritance changes, and suspension/restoration. Update assignment state and counters in one
  provider transaction for assignment create/update/delete.
- Protect the active definition and role-counter projection with an optimistic revision condition so concurrent
  administration writes fail together instead of overwriting a newer projection.
- Count unique stored subject-role relationships for administration counters. Keep temporal grant evaluation in
  the runtime authorizer so a timer crossing `validFrom` or `expiresAt` does not require an untracked counter
  mutation.
- Keep subject assignment records on a strongly consistent base-table path. If projection rebuilding needs a
  cross-subject collection, maintain a transactionally consistent base-table collection copy and paginate it;
  do not use an eventually consistent GSI as proof that counters are current.

- Track create/edit mode independently from mutable draft values. Keep the stable identifier editable throughout creation and lock it only for records opened in edit mode.
- Validate application role and privilege IDs against `^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$`. During entry, allow only empty or valid partial kebab states, including a temporary trailing hyphen, and reject invalid typing or paste transitions with actionable field-level guidance. Keep Save disabled until the complete value passes the shared validator.
- Keep one Owner filter in the table toolbar. Do not also attach an Owner filter to the Owner column metadata.
- Show suggestions as the user types against human-readable titles, stable IDs, and useful policy metadata.
- Render only directly selected values as chips; do not create chips for transitive role inheritance.
- Give every chip an accessible, keyboard-focusable remove control with an `X` icon and a descriptive label.
- Support keyboard navigation for suggestions and keep visible labels and helper text associated with the field.
- Source privilege suggestions from the authoritative access-control definition and copy the complete privilege statement when assigning it to a role.
- Deduplicate privileges by ID within the edited role and persist removals as a complete replacement of that role's direct privilege set.
- Exclude the current role, already selected roles, and every role that directly or transitively inherits the current role from inheritance suggestions.
- Keep server-side cycle, protected-capability, and catalog validation authoritative; client filtering is usability and early feedback, not the security boundary.
- Show role status in the table and require an alert-dialog acknowledgement plus a non-empty reason for suspend and restore. Warn when the actor targets their primary role.
- On the resource page, expose domains in a focused management dialog, sort them alphabetically by display name, validate new IDs during entry and on the server, and use reasoned alert-dialog confirmation for suspension and restoration. Render the resource form's domain as a picker and prevent new selections of suspended domains.
- Show resource status in the resource table and expose reasoned Suspend/Restore actions using `CiAlertDialog`. Preserve the resource record and policy, explain that a suspended parent domain still denies a restored resource, and keep recovery-resource suspension unavailable in both UI and trusted server logic. A generic save entry point may accept the transition only when it delegates immediately to the same trusted `setResourceStatus()` path; it must never persist caller-supplied status metadata directly.
- Use `privilegesMode: "replace"` only when a trusted editor submits a complete role privilege selection. Retain the default merge-by-ID behavior for ordinary catalog composition.

## Validation checklist

- Validate the complete catalog for duplicate IDs, unknown references, empty lists, cycles, and unsafe wildcards.
- Test inherited privilege evidence (`assignedRoleId` and `privilegeRoleId`).
- Test exact and descendant propagation at system, global, tenant, and Org Unit boundaries.
- Test expired and not-yet-active assignments.
- Test direct suspended assignments, suspended roles in inheritance paths, restoration, status metadata, core-role authority, and break-glass protection.
- Test suspended-domain denial, domain restoration, naming validation, protected `platform` recovery, and rejection of new resources assigned to suspended domains.
- Test suspended-resource denial, resource restoration, status metadata, domain-over-resource precedence, core authority, and protected access-control recovery resources.
- Test deny-overrides and highest-precedence conflicts when both algorithms are supported.
- Test that `system-admin` receives base `user` access but no inherited business-admin privileges.
- Test direct-assignment requirements and bootstrap preservation for `system-super-admin`.
- Test application-layer collision and protected-capability rejection.
- Test searchable selector keyboard behavior, chip removal, persisted privilege replacement, and direct and transitive cycle filtering.
- Typecheck and test `packages/emberguard` and the `packages/core` facade, then validate affected provider and application consumers.
