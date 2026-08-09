# Core backend manifests

CloudIgniter builds its core backend from two typed manifests:

- `packages/aws/src/server/backend/resources/resource-registry.ts` registers the logical resource modules that own handler IDs, environment allowlists, dependencies, and policies.
- `ci-core-amplify-manifest.ts` is the minimal application binding: it associates active logical handlers and tables with concrete Amplify function factories and Data models.

Generic manifest types, validation, projections, environment selection, runtime construction, and protected resource merging live in `@cloudigniter/aws/server/backend`. The package validates both manifests against each other at synthesis time. `backend-core.ts`, `auth.ts`, `data.ts`, and `ci-post-build.ts` consume derived projections and should not need one-off resource wiring.

## Add a core handler

1. Implement and export the package handler. Add a new known handler ID only when the ID does not already exist.
2. Add the handler to its owning package resource module, including an explicit environment allowlist and one policy representation.
3. Define the Amplify function resource and, when applicable, reference it from the Data schema or Auth configuration.
4. Add one function binding to the appropriate feature in `CI_CORE_AMPLIFY_MANIFEST`.

The backend shape, Lambda lookup, post-build inclusion, and effective environment filtering are derived from that binding.

## Add a core DynamoDB table

1. Add its logical key to `CI_CORE_TABLE_KEYS` and define/register its package resource module in `CI_CORE_BACKEND_MANIFEST`.
2. Add the corresponding Amplify Data model.
3. Add one table binding with its model and output names to `CI_CORE_AMPLIFY_MANIFEST`.

Runtime resources, table ARN lookup, outputs, and table-grant resolution are derived from the table binding. Use table grants or inline DynamoDB policies for a handler, never both.

## Lifecycle and verification

Only active, implemented resources belong in the manifests. Keep future IDs in their planned catalogs until their handler and Amplify binding exist.

Run:

```sh
pnpm --dir packages/aws test
pnpm --dir packages/aws typecheck
pnpm --dir apps/template test
```
