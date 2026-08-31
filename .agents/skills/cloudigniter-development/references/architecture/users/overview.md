# Users and Identity Administration

## Ownership

- `packages/core` owns provider-neutral `CIUser`, `CIUserProfile`, `CIUserEntity`, lifecycle inputs, and results.
- `packages/aws` owns `CICognitoUser`, Cognito SDK mapping, and provider services/handlers.
- EmberGuard owns scoped role assignments and authorization evaluation.
- `packages/ui` owns the reusable `CiDataTable` administration and Trash presentation.
- The template binds Amplify resources, composes provider/profile/assignment data, and enforces trusted server actions.

Core must not depend on Cognito. AWS must not own application-profile fields. Browser code must never receive SDK
clients or call provider administration APIs.

## Identity and projections

Use the immutable Cognito `sub` as `userId`. Treat email as the sign-in alias and Cognito username as a provider
lookup value. `CIUser` is the application join projection, not another source of identity truth.

Default lists to `detailLevel: "summary"`: stable ID, username/email, display name/avatar, status, provider, roles,
assignment summaries, deletion metadata, and timestamps. Attach full `CIUserProfile` and provider identity only for
detail/edit requests. Never fetch address, birth date, gender, biography, or raw provider attributes for routine
table or authorization paths.

The fixed profile uses optional provider-neutral fields plus exactly one application extension seam,
`extensions: Record<string, unknown>`. Applications namespace and validate extension values. Never store secrets or
credentials there. Role strings on the profile are a list projection; Cognito groups and EmberGuard assignments
remain authoritative.

## Persistence and lifecycle

Keep profiles in the User Profile bounded-context table. Base gets use Cognito `sub`; username/email lookups and
active/Trash collections use secondary-index queries. The `deletionState` GSI is eventually consistent and is only
for lists. Restore and purge must re-read the base profile and prove the current state. Do not use request-path
scans. Do not add streams, replicas, TTL, or another index without a documented access pattern and cost decision.

Creation participants are Cognito identity/groups, profile, and EmberGuard assignments. Cross-service failure must
remain visible and retryable; disable/soft-delete an incomplete identity when downstream assignment creation fails.
Suspension is independent from deletion and records trusted actor/time/reason metadata. Soft delete disables Cognito and records trusted metadata. Restore clears
deletion and re-enables unless independently suspended. Trash-only purge requires reason plus exact-ID confirmation,
deletes assignments, and idempotently removes Cognito then the profile.
If Cognito is already absent but the deleted profile remains, Trash must still synthesize a retryable row from the
profile; never hide the remaining participant merely because the provider join is incomplete.

Trusted server actions must check `identity.users` permissions, protect `system-super-admin`, prevent self-suspend
and self-delete, and never trust actor/time/provider state from the browser. Cognito IAM is least-privilege plumbing,
not the application authorization boundary.
Profile owners may update ordinary profile fields only; provider linkage, verification, role projection, status,
and deletion fields must remain owner-readable but administration-writable.

## Compatibility and validation

Moving legacy profiles from username keys to `sub` is an intentional pre-production cutover; migrate or reseed
existing data. Cognito required/sign-in attributes are deployment-sensitive.

Validate core and AWS types/handlers, UI and Next exports, template composition, active/Trash queries, denial and
protected-account paths, retry behavior, no-scan access, public documentation, and the Graphify graph.
