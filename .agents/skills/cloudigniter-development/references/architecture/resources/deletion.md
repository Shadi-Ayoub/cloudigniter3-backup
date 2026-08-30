# Resource Deletion Lifecycle

Use this reference whenever a task creates, changes, reviews, diagnoses, or documents deletion of a CloudIgniter
resource such as a user, tenant, Org Unit, role, assignment, provider resource, or generated data entity.

Read the [resources overview](overview.md) for adjacent Resource Studio references and the [access-control overview](../access-control/overview.md) for authorization catalog behavior.

## Default contract

- A user-facing action labeled `Delete` performs a soft delete by default.
- Soft deletion preserves the authoritative record, stores trusted actor/time/reason/operation metadata, removes
  the resource from ordinary lists and resolution paths, and makes it visible in `/dashboard/trash` to an
  authorized administrator.
- `Restore` reverses every reversible participant change and returns the resource to ordinary resolution without
  silently changing its prior independent operational status.
- `Delete permanently` (also called purge or hard delete in implementation code) is a separate Trash-only action.
  It requires the resource to already be soft-deleted, a fresh authorization decision, a non-empty reason, exact
  identifier confirmation, and an irreversible-action warning.
- Protected bootstrap, system, recovery, or currently required resources must be rejected by trusted server logic,
  not merely hidden in the UI.

Do not use status values such as `suspended` or `archived` as aliases for deletion. Deletion is an orthogonal
lifecycle overlay so restoration preserves the resource's previous operational status.

## Participant plan

Before implementing any delete, list every authoritative or derived location that represents or grants access to
the resource. Typical participants include:

- the primary DynamoDB/control-plane record;
- lookup and list projections, GSIs, denormalized counters, assignments, memberships, and cached resolution data;
- Cognito or another identity provider (disable on soft delete, re-enable on restore, delete only during purge when
  the resource is an identity);
- files, blobs, secrets, domains, external provider objects, search indexes, and event subscriptions;
- authorization inventory and audit/event records.

Record whether each participant is authoritative, reversible, purge-only, asynchronous, or intentionally not
applicable. A tenant has no direct Cognito identity, for example, so tenant deletion must not invent a Cognito
mutation; user deletion normally does require Cognito participation.

When a lifecycle spans services that cannot share one transaction, implement an idempotent operation/saga with a
stable operation ID and persisted participant progress. Deny ordinary access as early as safely possible, retry
only incomplete idempotent participants, and expose partial failure for operator recovery. Never report success
while a required participant is unknown or failed.

## DynamoDB rules

- Keep deleted records in their existing bounded-context table unless security, retention, or operational
  requirements demand a separate boundary.
- Use a deletion-state field plus trusted deletion metadata. Update collection/index keys so ordinary queries
  exclude deleted records without a request-path `Scan`; query Trash through a named bounded access pattern.
- Remove active lookup projections during soft delete and reconstruct them conditionally during restore.
- Require conditional writes for state transitions: active to deleted, deleted to active, and deleted to purged.
- Use strongly consistent base-table reads for transition preconditions. A GSI may list Trash but must not prove
  that a resource is currently safe to restore or purge.
- A purge deletes every owned record/projection according to the participant plan. Retain immutable audit evidence
  only when policy explicitly requires it and ensure it does not contain the deleted resource payload unnecessarily.

## Authorization and UI

- Model separate authorization actions for `delete`, `restore`, and `purge`; do not infer purge authority from UI
  visibility.
- Re-resolve the actor and authorization on the trusted server boundary for every transition. Actor identifiers and
  timestamps come from trusted runtime state, never browser input.
- Use `CiAlertDialog` with pending/error feedback. Soft-delete copy must explain restoration; purge copy must state
  irreversibility and require exact identifier confirmation.
- Keep row-action ordering stable, reserve conditional action space, preserve the table during refresh, and remove a
  successfully transitioned row from the current view.
- The Trash table mirrors enough fields from the source management table to identify the resource and additionally
  shows deletion time, actor, and reason where disclosure is permitted.

## Completion checklist

- Ordinary reads, routing, lookup, authorization, and list projections exclude deleted resources.
- Trash lists deleted resources through bounded indexed access and pagination.
- Soft delete, repeat delete, restore, repeat restore, protected-resource rejection, concurrent transitions, purge
  before delete, confirmation mismatch, and successful purge are tested.
- Every provider participant has delete/restore/purge behavior or an explicit not-applicable decision.
- User and contributor guides describe the default, Trash workflow, permissions, failure recovery, retention, and
  provider-specific effects.
- Public lifecycle types are exported through the owning package entry point and affected consumers are validated.
