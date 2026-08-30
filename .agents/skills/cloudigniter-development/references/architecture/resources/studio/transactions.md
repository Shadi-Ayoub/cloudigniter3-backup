# Resource Studio Transactions

Use this reference for fail-closed planning, collision detection, confined file mutation, Drop, and exact local rollback.

## 7. Plan and mutate fail-closed

Before preparing a transaction:

1. Normalize every descriptor and create the complete deterministic AWS and Next.js plan.
2. Inspect core, manual-custom, and other generated reservations.
3. Reject duplicate resource IDs, model names, logical routes, list-query names, and output paths.
4. Confine every path to its registered generated root.
5. Reject absolute paths, traversal, NULs, unsafe separators, symlink traversal, non-regular targets, unowned existing files, and generated-file drift.
6. Calculate all creates, replacements, and deletions before writing anything.

When a planner version expands the generated artifact closure for existing descriptors, implement an explicit versioned output migration that can reconstruct the known prior plan. Treat expected absence of an artifact newly introduced by that migration as a create, not as drift. If that target already exists without proven generated ownership, fail with an ownership collision and never adopt it.

Apply create, update, and drop through one confined journaled file transaction. Keep the descriptor ID immutable. Treat Drop as a new forward transaction that removes entity-owned artifacts and regenerates shared registries; it is not transaction undo.

## 8. Keep rollback claims exact

Store exact before- and after-images, modes, and created directories under `.cloudigniter/local/resource-studio/transactions`. Use atomic replacement. Before rollback changes any target, verify every tracked after-image. On any drift, report all conflicts and change nothing.

Undo applied transactions in last-in, first-out order. Restore previous bytes and modes, recreate deleted files, remove transaction-created files, and remove only transaction-created directories that remain empty. Keep the journal private and ignored.

Describe this only as exact local-file rollback. It does not restore AWS, CloudFormation state, DynamoDB records, SSO state, caches, dependencies, or files outside the transaction. Reconcile a deployed definition through a separately reviewed compensating deployment. Require an independent export, migration, backup, and restore plan for valuable data.

## Related references

- [Resource Studio overview](overview.md)
- [Data entities and generation](data-entities-and-generation.md)
- [Deployment and security](deployment-and-security.md)
- [Validation](validation.md)
