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

Every management page uses the same progressive-disclosure flow:

1. Expose exactly one top-level `Seeder` action, with an icon, in the table toolbar. Do not place separate
   `Seed` and `Clean up` actions above the table.
2. Open a `Dialog` with the seeder title and description. Put the non-destructive `Seed` action and the
   `Clean Up` entry point inside that dialog, together with dismissible semantic feedback.
3. Launch cleanup from the dialog into a separate destructive `CiAlertDialog` that names the seeder and
   explains its provenance safeguards. Return to or retain the Seeder dialog so the result remains visible.
4. While either operation is pending, disable repeat submission and prevent dismissal by close, escape, or
   outside interaction. Use a readable pending label and spinner.

Start from the existing Tenant and Org Unit management Seeder flow before creating another composition. Extract
shared presentation into `packages/ui` when repetition warrants it; keep fixture names and application callbacks
in the template.

Do not add a CLI command that bypasses the authenticated application boundary or grants a developer workstation
direct table access. A future `ci seed` command must invoke the same deployed least-privilege capability with a
verifiable application actor/target and repeat the environment and role checks. Until that identity contract is
implemented, use the authenticated UI/server-action path.

## Amplify schema and output synchronization

When a seeder writes an Amplify Data model, treat the source model, generated GraphQL schema, generated
`amplify_outputs.json` model introspection, deployed AppSync schema, mutation payload, and fixture fields as one
versioned contract.

- After adding, removing, or changing a model field, synthesize and deploy the intended Amplify environment and
  regenerate its outputs before exercising the seeder or management UI against it. Deployment remains an
  external mutation and still requires the task's normal authorization.
- Before QA, verify that generated `Create<Model>Input` and `Update<Model>Input` definitions and the outputs'
  model introspection contain every field the application sends. Confirm that the application is using outputs
  from the same environment that received the schema deployment.
- Treat a GraphQL error saying that an input contains a field not defined for an input object as client/deployed
  schema drift until inspection proves otherwise. Compare the source schema, generated input, outputs, target
  environment, and payload instead of weakening types or deleting requested fields from fixtures.
- Distinguish field presence from scalar wire shape. Under the current User Profile contract, `address`,
  `extensions`, `statusChange`, and `deletion` are structured domain values backed by AppSync `AWSJSON`. An error
  such as `Variable 'address' has an invalid value` means the caller sent the wrong scalar representation when the
  deployed field is `AWSJSON`: inspect the synthesized input and exact mutation variables, then serialize once at
  the AWS boundary and decode on read. Keep fixture JSON object-shaped.
- Do not hide drift by casting the payload, silently filtering domain fields, or teaching a seeder to tolerate
  an obsolete schema. If deployment is outside the authorized scope, keep the source contract correct, report
  the pending deployment explicitly, and do not claim the runtime workflow is verified.

## Validation

- Test the shared gate across development, test, staging, production, anonymous actors, role case, empty roles,
  and disabled features.
- Test path traversal, non-JSON files, oversized files, invalid JSON, and non-array fixtures.
- Test seed create, same-seeder retry, collision preservation, partial failure, cleanup, orphan-marker cleanup,
  ownership drift, malformed markers, pagination, and absence of scans.
- Verify exact PK/SK strings, transaction conditions, handler environment checks, AppSync group admission, IAM,
  package exports, consuming server actions, UI pending/feedback/confirmation behavior, and documentation.
- Verify that each management page renders one top-level `Seeder` action whose dialog owns Seed/Cleanup choices
  and whose cleanup path uses a separate destructive confirmation.
- For Amplify-backed seeders, verify the synthesized create/update input and environment outputs include every
  field sent by fixtures and mutation adapters before running the end-to-end seed smoke test.
