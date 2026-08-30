# Assignments and Enforcement

Use this reference for provider group mappings, authoritative scoped assignments, trusted-boundary enforcement, and decision evidence. Read [permissions.md](permissions.md) for scope matching and [roles.md](roles.md) for inheritance and precedence.

## Provider and enforcement strategy

- Map identity-provider groups to stable lowercase kebab role IDs through explicit configuration, and treat provider group membership changes as an operator migration.
- Keep the catalog authoritative for privileges and precedence; do not duplicate policy in provider groups.
- Grant `system-admin` and `system-super-admin` only to technical administrators through controlled, auditable workflows.
- Grant `admin` and `super-admin` for application-business administration at global, tenant, or Org Unit scopes as intended.
- Minimize standing `system-super-admin` access and use it as protected bootstrap or break-glass authority.
- Re-resolve provider membership and persisted assignments on trusted server boundaries before sensitive mutations.
- Return and retain authorization decision evidence for diagnostics and audit without exposing secrets.

## Related references

- [Access-control overview](overview.md)
- [Catalog composition and overrides](catalog-and-overrides.md)
- [Administration](administration.md)
- [Validation](validation.md)
