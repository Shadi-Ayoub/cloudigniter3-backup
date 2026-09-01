# Users and Identity Administration

## Ownership

- `packages/core` owns provider-neutral `CIUser`, `CIUserProfile`, `CIUserEntity`, administrator-authority policy,
  lifecycle inputs, and results.
- `packages/aws` owns `CICognitoUser`, provider SDK mapping, Root bootstrap, and provider mutation guards.
- EmberGuard owns scoped role assignments and authorization evaluation.
- `packages/ui` owns the reusable `CiDataTable` administration and Trash presentation.
- The template binds deployed resources, joins identity/profile/assignment data, separates user and administrator
  collections, and enforces trusted server actions.

Core must not depend on Cognito. AWS must not own application-profile fields. Browser code must never receive SDK
clients or call identity-provider administration APIs.

## Identity, profile, and projections

Use the identity provider's immutable subject identifier as `userId`. Treat email as a sign-in alias and the
provider username as a lookup value. `CIUser` is an application join projection, not another source of identity
truth.

The AWS `CICognitoUser` adapter normalizes enabled/status state; email and verification; `given_name`,
`middle_name`, and `family_name`; provider metadata; raw attributes; and every role-bearing Cognito group. Groups
are stable `{ id, precedence?, description? }` records sorted by provider precedence. The reserved Root marker is
projected to `isRootUser` and excluded from `groups`; it is identity metadata, not a role.

Default lists to `CIUser` with `detailLevel: "summary"`: stable ID, username/email, common given/family names,
display name/avatar, status, provider, all role IDs, `primaryRole`, scoped assignments, Root/deletion projections,
and timestamps. `roles` is the complete identity-provider role list. `primaryRole` is the highest-precedence known
role and only a display/defaulting hint; it never replaces `roles` or an authorization decision. Attach the full
`CIUserProfile` and provider identity only for detail/edit requests. Never fetch address, birth date, gender,
biography, or raw provider attributes for routine table or authorization paths.

The fixed profile uses optional provider-neutral fields plus exactly one application extension seam,
`extensions: Record<string, unknown>`. Applications namespace and validate extension values. Never store secrets or
credentials there. Keep the stable avatar object key in `avatarKey`, using an identity-owned prefix such as
`user-avatars/{userId}/profile.webp`; resolve S3 signed or CDN URLs into `avatarUrl` only for delivery because those
URLs can expire. Role strings on the profile are a read/list projection; provider groups and EmberGuard assignments
remain authoritative.

## User and administrator governance

`/dashboard/users` lists accounts without a canonical administrator role. `/dashboard/administrators` lists Root
and accounts holding `admin`, `super-admin`, `system-admin`, or `system-super-admin`. An assignment-only delegation
must not classify an otherwise ordinary account as an administrator.

Administrator management uses the explicit authority order `admin < super-admin < system-admin <
system-super-admin`. A non-Root administrator may manage peers and lower-ranked administrators, but never a
higher-ranked target. Root may manage every non-Root administrator. A Root target permits only ordinary profile
editing by that same Root owner; no other actor may edit it, change its authority, suspend it, or delete it. The
`system-super-admin` role alone does not make an account Root.

Root ownership is durable and singular: bootstrap owns the reserved identity marker `cloudigniter-root-user` and
projects it as read-only `UserProfile.isRootUser`. Joining may recognize either trusted projection so deleted or
temporarily incomplete provider records remain governable, but code must never infer Root from email, username, or
role. Bootstrap must reject a conflicting marker owner.

`system-super-admin-manager` is an assignment-only delegation. It is neither a core role, identity-provider group,
nor authority-rank increase. Only a caller carrying the Root identity marker may grant or revoke it, and a grant
must use exact system scope. An active valid grant lets an administrator manage system-super-admin targets but
never Root.

## Persistence and lifecycle

Keep profiles in the User Profile bounded-context table. Base gets use the immutable `userId`; username/email
lookups and active/Trash collections use secondary-index queries. The `deletionState` GSI is eventually consistent
and is only for lists. Restore and purge must re-read the base profile and prove the current state. Do not use
request-path scans or add streams, replicas, TTL, or another index without a documented access pattern and cost
decision.

Creation participants are provider identity/groups, profile, and EmberGuard assignments. Cross-service failure
must remain visible and retryable; disable or soft-delete an incomplete identity when downstream assignment
creation fails. Suspension is independent from deletion and records trusted actor/time/reason metadata. Soft delete
disables the identity and records trusted deletion metadata. Restore clears deletion and re-enables unless
independently suspended. Trash-only purge requires reason plus exact-ID confirmation, deletes assignments, and
idempotently removes the provider identity then profile. If the provider identity is absent but a deleted profile
remains, Trash must synthesize a retryable row from the profile.

Trusted server actions must check `identity.users` permissions, apply administrator-target hierarchy, prevent
self-suspend and self-delete, and never trust actor/time/provider state from the browser. Provider IAM is
least-privilege plumbing, not the application authorization boundary. Profile owners may update ordinary profile
fields only; provider linkage, verification, role/Root projections, status, and deletion fields remain
owner-readable but administration-writable.

## Presentation and deterministic rendering

Use the shared `CiDataTable` convention on both management pages. Keep the identity provider as an icon-bearing,
colored page-header chip rather than a repeated row value. Show a generic avatar icon when no image is available.
Display role and assignment counts in the table and reveal complete values in dismissible dialogs; mark the
primary role without hiding additional roles. Provide status and role filters.

Server-rendered timestamps must use the same explicit locale and time zone during SSR and hydration. Pass the
resolved application locale into `ciFormatDateTime`, which formats with a fixed `UTC` time zone and deterministic
fallback. Do not derive the first render from browser locale, `Date.now()`, or another client-only value.

## Deployment compatibility and validation

Treat the Amplify model source, generated GraphQL model/input client, `amplify_outputs.json`, deployed AppSync
schema, and backing resources as one versioned contract. After changing `UserProfile`, deploy or regenerate the
backend outputs before exercising the UI. An error such as an unknown field on `CreateUserProfileInput` indicates
schema/output drift; do not remove the new field merely to match a stale deployment. Cognito required and sign-in
attributes are also deployment-sensitive.

Core and fixture values for `address`, `extensions`, `statusChange`, and `deletion` remain structured objects.
Amplify exposes those four model fields as AppSync `AWSJSON`, whose variable representation is a JSON string. The
AWS adapter serializes all four exactly once at create/update boundaries, preserves `null` for clearing a field,
omits `undefined`, and decodes transport strings on reads while accepting values already decoded by a client. An
error such as `Variable 'address' has an invalid value` is a scalar wire-shape mismatch when the deployed field is
`AWSJSON`, not a reason to stringify the fixture or weaken `CIUserPostalAddress`. Test the exact mutation variables
and round-trip provenance, status, and deletion metadata together.

All seven Cognito user-administration operations are AppSync resolver functions and belong physically to Amplify's
Data resource group. The five mutations also read the EmberGuard access table. Create their exact Cognito IAM
policies under each Lambda through the post-build plan so dependency tokens flow only from Data to Auth. Do not
reintroduce core `defineAuth(...access)` rules for these Data-stack functions: Amplify creates those policies in
Auth and attaching them to Data roles recreates an Auth-to-Data edge. Actual Cognito trigger functions remain in
Auth.

Moving legacy profiles from username keys to immutable subject IDs is an intentional pre-production cutover;
migrate or reseed existing data. Validate core and AWS types/guards, UI and Next exports, summary/full projections,
both management collections, active/Trash queries, Root/hierarchy/delegation denials, retry behavior, deterministic
SSR output, schema/output compatibility, no-scan access, public documentation, and the Graphify graph.
