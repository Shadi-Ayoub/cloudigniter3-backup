# Development Tools and Application Seeding

Use this reference when changing the developer role gate, Dev Beacon, Debug Probe, development-only UI, JSON
seeder manifests, seed/cleanup handlers, seed provenance, or a future CLI seeder entry point.

Read [CLI development](development.md) for command/runtime conventions and the [access-control roles reference](../architecture/access-control/roles.md) for exact developer-role semantics.

## Access invariant

Every developer capability requires all three conditions:

1. `CI_ENV_MODE` resolves to exactly `development`;
2. the actor is authenticated at a trusted server boundary;
3. the actor has an exact canonical `developer` role ID.

Use `ciCanAccessDeveloperTools()` from `@cloudigniter/core/lib` for the shared decision. Role IDs are
case-sensitive and must not be normalized. Presentation gating improves usability but does not authorize a
mutation: server actions and provider handlers repeat the decision. AppSync may list `developer` as an allowed
group so the request reaches the handler, but the handler must still reject every non-development environment.

Dev Beacon and Debug Probe consume the same shared decision. Do not add a feature-specific bypass, anonymous
local-development shortcut, browser-only environment check, or production override.

## Ownership

```text
packages/core
    public gate, generic seeder contracts, confined JSON loader
packages/aws
    provider persistence, atomic seed markers, bounded cleanup, least-privilege IAM
packages/next
    server/client wrapper propagation for development UI capabilities
packages/ui
    reusable pending, feedback, and confirmation controls
apps/template/src/custom/dev/seeder
    application-owned manifest and JSON fixture data
apps/template
    thin server actions and provider-operation composition
```

Application fixture data and definitions belong only under `src/custom/dev/seeder`. Reusable parsing,
authorization, provider, and UI behavior does not belong there.

## Seeder manifest

Each `CiSeederDefinition` declares a stable lowercase kebab ID, title, resource capability, data directory, JSON
files, create operation ID, and cleanup operation ID. Operation IDs are resolved through a trusted application
allowlist; never fetch or execute an arbitrary URL or module path from JSON.

`ciReadJsonSeederData()` confines every resolved path beneath `src/custom/dev/seeder` by default, accepts only
regular `.json` files, applies a size limit, requires array-shaped JSON, and merges files in declaration order.
Domain validation still belongs at the application/provider boundary.

## Provenance and garbage collection

Never identify seeded data by a name prefix or by re-reading only the current fixture list. Fixtures can change.
Persist explicit seed provenance and an atomic marker for every created resource. A cleaner queries the bounded
marker partition, strongly reads the target, and deletes target plus marker conditionally in one transaction.

For tenant seeds:

- tenant and marker live in the System-table bounded context;
- tenant creation and marker creation are one `TransactWriteItems` call;
- existing non-owned tenant IDs fail and are never overwritten;
- cleanup uses a strongly consistent base-table `Query`, never `Scan`;
- a target is deleted only when its provenance still matches the seeder and it is not protected;
- an absent target permits removal of its orphan marker;
- a malformed or ownership-mismatched record is preserved and reported.
- optional Org Unit fixtures are created parent-first after tenants, each with its own marker; cleanup removes Org Units deepest-first, including tenant/path attachments, before tenant records.
- DynamoDB transaction IAM includes `TransactWriteItems` plus every component action actually used: `ConditionCheckItem`, `PutItem`, `UpdateItem`, or `DeleteItem`.

List every participant for new seeders. User cleanup, for example, may include Cognito and a profile table and
therefore needs an idempotent cross-service operation rather than copying the tenant cleaner.

## UI and CLI

Render seeder controls only after a server-resolved developer-tools decision. Disable repeat submission, show
pending state, return semantic success/failure feedback, and require `CiAlertDialog` confirmation for cleanup.

Do not add a CLI command that bypasses the authenticated application boundary or grants a developer workstation
direct table access. A future `ci seed` command must invoke the same deployed least-privilege capability with a
verifiable application actor/target and repeat the environment and role checks. Until that identity contract is
implemented, use the authenticated UI/server-action path.

## Validation

- Test the shared gate across development, test, staging, production, anonymous actors, role case, empty roles,
  and disabled features.
- Test path traversal, non-JSON files, oversized files, invalid JSON, and non-array fixtures.
- Test seed create, same-seeder retry, collision preservation, partial failure, cleanup, orphan-marker cleanup,
  ownership drift, malformed markers, pagination, and absence of scans.
- Verify exact PK/SK strings, transaction conditions, handler environment checks, AppSync group admission, IAM,
  package exports, consuming server actions, UI pending/feedback/confirmation behavior, and documentation.
