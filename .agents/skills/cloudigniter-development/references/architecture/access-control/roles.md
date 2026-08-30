# Roles

Use this reference for role responsibilities, inheritance, precedence, suspension, and the protected core role lanes.

## Role design

Design roles around stable responsibilities rather than people, screens, or temporary teams. Prefer focused roles that can be assigned together over one broad role spanning unrelated duties.

Use inheritance only for a real responsibility hierarchy. Do not use it merely to deduplicate a privilege shared by unrelated roles. Keep inheritance acyclic and within one catalog.

For custom application roles:

- inherit the narrowest suitable core or application role;
- follow the catalog-wide lowercase kebab convention for role and privilege IDs;
- assign explicit privileges for the additional responsibility;
- use stable role and privilege IDs because they appear in persistence and audit evidence;
- use concise privilege titles that describe the granted or denied capability to administrators;
- avoid wildcards for sensitive capabilities unless broad access is deliberate and reviewed;
- separate business administration, technical operations, support, audit, and emergency access;
- test both the intended allow path and a nearby denial path.

Treat `status` as additive policy state: omitted means `active`; `suspended` requires actor, timestamp, and reason
metadata for the latest transition. Keep assignments intact during suspension so restoration is explicit and
reversible. Do not add automatic restoration, and never permit `system-super-admin` to be suspended.

## Core role lanes

Keep business administration and technical platform administration as separate inheritance lanes:

```text
user
├── developer
├── admin
│   └── super-admin
└── system-admin
    └── system-super-admin
```

| Role                 | Responsibility                                                                          | Inherits       |
| -------------------- | --------------------------------------------------------------------------------------- | -------------- |
| `user`               | Base authenticated application access                                                   | —              |
| `developer`          | Developer tooling                                                                       | `user`         |
| `admin`              | Business administration within global, tenant, or Org Unit scopes                       | `user`         |
| `super-admin`        | Elevated business administration                                                        | `admin`        |
| `system-admin`       | Technical platform settings, tenant infrastructure, and system access-control operation | `user`         |
| `system-super-admin` | Technical bootstrap, break-glass, and protected core-policy administration              | `system-admin` |

Preserve these invariants:

- `system-admin` must not inherit `admin` or `super-admin`, directly or transitively.
- `system-super-admin` may inherit `system-admin`, but no other role may inherit `system-super-admin`.
- A directly assigned, system-scoped `system-super-admin` is required for a protected core access-control override.
- A direct privilege or inherited application role must not substitute for that bootstrap assignment.
- Precedence remains a conflict-resolution order and does not merge the technical and business lanes.

When one person needs both technical and business duties, assign roles from both lanes at the appropriate scopes. Do not join the lanes by changing core inheritance. This keeps grants, reviews, and revocation explicit.

## Related references

- [Access-control overview](overview.md)
- [Permissions and scopes](permissions.md)
- [Assignments and enforcement](assignments.md)
- [Catalog composition and overrides](catalog-and-overrides.md)
