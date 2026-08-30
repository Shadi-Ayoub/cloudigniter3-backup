# Access Control

Use this folder for CloudIgniter authorization catalogs, policy evaluation, scopes, assignments, role design, provider mappings, and protected core overrides.

## Reading map

- Read [permissions.md](permissions.md) for evaluation order, combining algorithms, and scope propagation.
- Read [roles.md](roles.md) for role design, inheritance, precedence, and protected core roles.
- Read [assignments.md](assignments.md) for provider mappings, authoritative assignments, and enforcement.
- Read [catalog-and-overrides.md](catalog-and-overrides.md) for catalog composition, persistence, migrations, and protected overrides.
- Read [administration.md](administration.md) for security-administration projections and UI behavior.
- Read [validation.md](validation.md) before completing an access-control change.

## Model and ownership

Treat CloudIgniter authorization as provider-neutral, scoped ARBAC:

```text
subject + scoped assignments
        + resource/action request
        + authoritative runtime scope
        ↓
compiled access-control catalog
        ↓
auditable allow/deny decision
```

- Define stable domains, resources, actions, roles, and privileges in the catalog.
- Require every domain, action, role, and privilege ID—including core role IDs—to use lowercase kebab case; reserve lowercase dotted segments for resource capability IDs.
- Give every privilege a stable `id` and a required, human-readable `title`; use the title in forms and displays while retaining the ID for persistence and audit evidence.
- Treat resource-domain status as additive policy state: omitted means `active`; a suspended domain causes every resource in it to fail authorization with `suspended-domain` while preserving the catalog for restoration.
- Treat resource status as the child policy gate: omitted means `active`; a suspended resource fails with `suspended-resource` while preserving its actions, scopes, privileges, and domain relationship. Evaluate domain status first, so `suspended-domain` wins when both levels are suspended.
- Keep generic evaluation algorithms inside `packages/emberguard`.
- Expose supported helpers and public contracts through `@cloudigniter/core/lib` and `@cloudigniter/core/types`.
- Adapt provider groups and claims in the provider package, then normalize them into generic assignments.
- Resolve the authoritative subject and scope in the framework/runtime layer.
- Keep application catalog extensions and provider mappings in application configuration.

Model resources as business or platform capabilities such as `identity.users` or `platform.settings`, not as URLs. Enforce the same resource/action at every relevant page, server operation, resolver, job, and UI capability boundary.

## Configuration strategy

Expose application-wide EmberGuard policy settings beneath `auth.emberguard` in `cloudigniter.config.ts`:

```ts
auth: {
  emberguard: {
    accessControl: {
      combiningAlgorithm: "deny-overrides",
    },
  },
}
```

- Own the public configuration contracts in `packages/core` and export them through `@cloudigniter/core/types`.
- Keep the configuration provider-neutral; do not add Cognito, Next.js, or persistence details to it.
- Pass `auth.emberguard.accessControl` to the application authorizer during application composition.
- Preserve `deny-overrides` as the authorizer default when `combiningAlgorithm` or the complete `emberguard` block is omitted.
- Add future EmberGuard settings beneath focused subkeys rather than mixing authorization fields with authentication UI fields.
- Document and test any new setting at the core type boundary and at least one application consumer.

## Related architecture

- [EmberGuard](../security/emberguard.md) owns the internal provider-neutral capability.
- [Public API and runtime boundaries](../packages/public-api-and-runtime.md) governs exposed helpers and types.
- [Table keys](../persistence/table-keys.md) governs persisted access-control keys.
