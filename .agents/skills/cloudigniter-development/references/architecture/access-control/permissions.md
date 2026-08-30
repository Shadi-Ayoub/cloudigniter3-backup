# Permissions and Scopes

Use this reference for authorization evaluation, permission matching, combining algorithms, assignment scopes, and propagation.

## Evaluation strategy

Evaluate in this order:

1. Reject an unauthenticated subject when the capability requires authentication.
2. Reject unknown resources and actions.
3. Deny a resource in a suspended domain with `suspended-domain`.
4. Deny a suspended resource with `suspended-resource`.
5. Select active direct privileges and role assignments whose time bounds and scopes match.
6. Exclude suspended roles before expansion; they grant nothing and do not bridge inherited privileges.
7. Expand active role inheritance and retain both the assigned role and privilege-owning role as decision evidence.
8. Match resource and action patterns.
9. Apply the configured combining algorithm.
10. Deny when no applicable privilege allows the request.

Use `deny-overrides` by default. Any matching deny defeats matching allows. Use `highest-precedence` only when the strongest applicable assigned role is intentionally authoritative; within the selected tier, deny still overrides allow. Treat direct subject privileges as the strongest tier in highest-precedence mode.

Keep these concepts separate:

- **Inheritance** composes privileges between roles.
- **Precedence** resolves conflicts between assigned roles; a lower number is stronger.
- **Scope** limits where an assignment applies.
- **Propagation** determines whether an assignment reaches descendants.

Never infer inheritance or scope from precedence.

## Scope strategy

Use the narrowest assignment that expresses the responsibility:

| Scope     | Intended boundary                                            |
| --------- | ------------------------------------------------------------ |
| `system`  | CloudIgniter platform operation and bootstrap administration |
| `global`  | Cross-tenant application responsibility                      |
| `tenant`  | One tenant                                                   |
| `orgUnit` | One Org Unit within a tenant                                 |

- Use `exact` when an assignment applies only at its declared boundary.
- Use `descendants` only when access must flow to lower scopes.
- Require authoritative ancestor IDs before treating an Org Unit as a descendant.
- Build those IDs from the stored tenant attachment/predecessor chain; never parse them from a URL. A shared canonical node still requires the assignment and requested scope to carry the same tenant ID.
- Keep global and system scopes separate; neither implies the other.
- Treat identity-provider membership as assignment input, not proof that an arbitrary requested scope is valid.
- Do not use client-controlled cookies, headers, or route parameters as authorization evidence without server-side resolution and validation.

## Related references

- [Access-control overview](overview.md)
- [Roles](roles.md)
- [Assignments and enforcement](assignments.md)
- [Validation](validation.md)
