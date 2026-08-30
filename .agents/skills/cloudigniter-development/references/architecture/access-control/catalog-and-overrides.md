# Catalog Composition and Overrides

Use this reference for the immutable core catalog, application extensions, persistence initialization, compatibility migration, and protected policy overrides.

## Catalog composition and overrides

Treat `CI_DEFAULT_ACCESS_CONTROL_DEFINITION` as immutable core policy.

- Import the initial persisted definition through `@cloudigniter/core/lib`. If the canonical active-state item is
  absent, initialize it conditionally from that definition at deployment bootstrap and on the first runtime read;
  never overwrite an existing state. Rebuild initial counters from any retained assignment collection before the
  create-only write. Use a single conditional `PutItem`, not a transaction, because initialization changes only
  one item. Local bootstrap must invoke the deployed access-control handler. Prefer the handler name in
  application outputs; if the provider omits it, accept only a uniquely discovered get-definition handler whose
  runtime configuration names the exact access table. Do not query the table with a developer SSO identity or
  widen that identity's DynamoDB permissions for seeding.
- Add application domains, resources, actions, roles, and privileges through `ciCreateAppAccessControl()`.
- Do not redefine core-owned entries from an application layer.
- Create an application role that inherits an eligible core role when extending a core responsibility.
- Never let an application role inherit `system-super-admin` or grant `platform.authorization.core.override`.
- Use `ciCreateCoreAccessControlOverride()` only for a deliberate, audited core change.
- Preserve the technical/business administrator separation and the `system-super-admin` bootstrap path across overrides.
- Persist override history immutably with conditional, consecutive revisions and step-up authentication in the provider adapter.
- Build every access-control PK, SK, and secondary-index key with the CloudIgniter core table-key helpers and follow the [table-key convention](../persistence/table-keys.md) for namespace, segment, and migration rules.
- On persisted-catalog reads, migrate only an absent legacy privilege `title` from the matching configured catalog entry or, for an unknown custom entry, a deterministic label derived from its stable ID before validation.
- Never normalize role IDs. Definitions, inheritance references, assignments, identity-provider groups, seed data, and integrations must all use the canonical lowercase kebab IDs and fail fast otherwise.
- Validate resource-domain IDs with the same lowercase kebab convention. Require actor, timestamp, and reason metadata for suspension, and never permit suspension of the `platform` recovery domain.
- Require actor, timestamp, and reason metadata for resource suspension. Never permit suspension of `platform.authorization` or `platform.authorization.core`; these resources preserve administration and break-glass recovery. Restoring a resource does not override a suspended parent domain.
- Do not repair explicitly blank or malformed titles, and validate every catalog write strictly. The read migration is compatibility behavior, not permission-policy normalization.

## Related references

- [Access-control overview](overview.md)
- [Roles](roles.md)
- [Assignments and enforcement](assignments.md)
- [Table keys](../persistence/table-keys.md)
- [Validation](validation.md)
