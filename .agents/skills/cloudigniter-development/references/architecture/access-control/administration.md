# Access-Control Administration

Use this reference for security-administration projections, selectors, editing flows, status transitions, and trusted server validation.

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

## Related references

- [Access-control overview](overview.md)
- [Roles](roles.md)
- [Assignments and enforcement](assignments.md)
- [Data-table interaction contract](../ui/data-table.md)
- [Validation](validation.md)
