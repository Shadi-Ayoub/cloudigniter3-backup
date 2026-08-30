# Resources

Use this folder for CloudIgniter resource ownership, generation, lifecycle, and deletion behavior.

## Reading map

- Read [Resource Studio overview](studio/overview.md) for the V1 local resource-authoring capability and its ownership model.
- Read [data entities and generation](studio/data-entities-and-generation.md) for descriptors, Amplify models, generated artifacts, and Tenant/global management pages.
- Read [transactions](studio/transactions.md) for collision-safe planning, apply, drop, and exact local rollback.
- Read [deployment and security](studio/deployment-and-security.md) for AWS preflight, local Studio security, and AppleDouble provenance.
- Read [Resource Studio validation](studio/validation.md) for V1 checks and exclusions.
- Read [deletion.md](deletion.md) for reversible deletion, restoration, Trash, retention, and provider purge behavior.

## Related architecture

Resource work commonly also needs the [template ownership boundary](../packages/template-core-custom-boundary.md), [DynamoDB design](../persistence/dynamodb.md), [table-key convention](../persistence/table-keys.md), and [CLI development](../../cli/development.md).
