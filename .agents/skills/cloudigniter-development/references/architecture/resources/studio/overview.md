# Resource Studio V1

Use this folder for every Resource Studio change. Treat these references as the V1 compatibility and safety contract, not merely as implementation notes.

## Reading map

- Start with [data entities and generation](data-entities-and-generation.md) for descriptors and generated backend/frontend artifacts.
- Read [transactions](transactions.md) for planner and rollback invariants.
- Read [deployment and security](deployment-and-security.md) for AWS deployment, local-server security, and filesystem metadata.
- Read [validation.md](validation.md) before completing a Resource Studio change.
- Read the parent [resources overview](../overview.md) and [deletion lifecycle](../deletion.md) when the resource itself has an operational delete/restore/purge workflow.

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

- [template-core-custom-boundary.md](../../packages/template-core-custom-boundary.md) for every generated template path and composition seam;
- [cli-development.md](../../../cli/development.md) for commands, browser orchestration, subprocesses, and deployment;
- [dynamodb-design.md](../../persistence/dynamodb.md) and [table-keys.md](../../persistence/table-keys.md) for models, indexes, access patterns, cost, and keys;
- [data-table.md](../../ui/data-table.md) for the generated manager interaction contract;
- [public-api-and-runtime.md](../../packages/public-api-and-runtime.md) for exports and client/server boundaries;
- [validation.md](../../../authoring/validation.md) before completion.

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
