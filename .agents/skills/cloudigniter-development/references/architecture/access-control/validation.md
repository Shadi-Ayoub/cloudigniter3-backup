# Access-Control Validation

Use this checklist after applying the relevant rules from [overview.md](overview.md), [permissions.md](permissions.md), [roles.md](roles.md), [assignments.md](assignments.md), [catalog-and-overrides.md](catalog-and-overrides.md), and [administration.md](administration.md).

## Validation checklist

- Validate the complete catalog for duplicate IDs, unknown references, empty lists, cycles, and unsafe wildcards.
- Test inherited privilege evidence (`assignedRoleId` and `privilegeRoleId`).
- Test exact and descendant propagation at system, global, tenant, and Org Unit boundaries.
- Test expired and not-yet-active assignments.
- Test direct suspended assignments, suspended roles in inheritance paths, restoration, status metadata, core-role authority, and break-glass protection.
- Test suspended-domain denial, domain restoration, naming validation, protected `platform` recovery, and rejection of new resources assigned to suspended domains.
- Test suspended-resource denial, resource restoration, status metadata, domain-over-resource precedence, core authority, and protected access-control recovery resources.
- Test deny-overrides and highest-precedence conflicts when both algorithms are supported.
- Test that `system-admin` receives base `user` access but no inherited business-admin privileges.
- Test direct-assignment requirements and bootstrap preservation for `system-super-admin`.
- Test application-layer collision and protected-capability rejection.
- Test searchable selector keyboard behavior, chip removal, persisted privilege replacement, and direct and transitive cycle filtering.
- Typecheck and test `packages/emberguard` and the `packages/core` facade, then validate affected provider and application consumers.

## Broader validation

Also complete the repository-wide [validation and final review](../../authoring/validation.md).
