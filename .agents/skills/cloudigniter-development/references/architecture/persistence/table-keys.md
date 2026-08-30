# CloudIgniter Table-Key Convention

Use this reference whenever work creates, changes, migrates, reads, writes, queries, or documents `PK`, `SK`, or secondary-index key values for a CloudIgniter-owned table item.

Read [DynamoDB design](dynamodb.md) for table boundaries, access patterns, consistency, security, cost, and operational decisions.

## Canonical shape

Build every CloudIgniter-owned primary and secondary-index key with `ciBuildTableKey()` or `ciBuildTableKeys()` from `@cloudigniter/core/lib`.

```text
CI#<CAPABILITY>#<ENTITY_OR_COLLECTION>#<opaque identifiers or qualifiers...>
```

- Start every PK, SK, GSI PK, and GSI SK with the helper-injected `CI#` namespace.
- Write structural segments in uppercase snake case, such as `EMBERGUARD`, `ACCESS_CONTROL`, `USER_PROFILE`, or `ROLE_ASSIGNMENT`.
- Preserve opaque IDs exactly. Do not lowercase, uppercase, trim, or otherwise normalize domain identifiers while building a key.
- Keep tenant or owner identity early enough in a partition key to make isolation and access patterns visible.
- Use `#` only as the segment delimiter. The helpers reject empty segments, surrounding whitespace, and embedded `#` characters.
- Do not pass `CI` as a segment; the helpers add the namespace.

For a primary key pair, prefer one call that makes the access pattern visible:

```ts
const key = ciBuildTableKeys({
  partition: ["TENANT", tenantId, "USER_PROFILES"],
  sort: ["USER_PROFILE", userId],
});
```

## Ownership and dependencies

Keep the convention and runtime-neutral builders in `packages/core`. Provider adapters decide which domain segments and access patterns represent their records.

Do not introduce a reverse dependency from a lower-level capability package to `packages/core`. When that would create a cycle, build the canonical key in an allowed consuming layer and inject the resulting key pair into the lower-level repository/provider contract.

## Cutover and migration rule

Changing a persisted key changes the item's address. Choose the strategy from the deployment lifecycle:

- Before production, replace all readers, writers, queries, fixtures, and documentation atomically. Do not add a legacy fallback or dual-write path. Reset or reseed disposable development data when necessary.
- After data is deployed and must be retained, design an explicit migration appropriate to the release. Add compatibility reads, backfills, or dual writes only when that migration requires them, and remove temporary paths deliberately.

Never add compatibility complexity merely because an old key appeared in development history.

## Validation

- Unit-test exact key strings and invalid segments in `packages/core`.
- Test the exact provider/repository read and write keys. For a pre-production cutover, verify that no legacy lookup or write remains.
- Search all consumers and guide examples for manually concatenated variants.
- Typecheck the core owner and each affected provider or application consumer.
