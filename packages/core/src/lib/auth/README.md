# CloudIgniter scoped ARBAC

CloudIgniter authorization is a provider-neutral, scoped role-based access
control model. Identity providers supply subjects and group memberships;
application code supplies the resource, action, and resolved scope. The core
package makes the decision without importing AWS, Next.js, a database client,
or an authentication SDK.

The model follows these rules:

- deny when no registered privilege allows a request;
- authenticate before authorizing;
- register resources and actions explicitly;
- assign reusable roles at a concrete system, global, tenant, or Org Unit boundary;
- use global descendant propagation explicitly for access across all tenants;
- keep global assignments isolated from system-only resources;
- propagate a grant to descendants only when the assignment explicitly says so;
- treat an Org Unit as a descendant only when its ancestor IDs are supplied;
- support explicit denies, inherited roles, time-bounded assignments, direct
  user exceptions, and dot-delimited wildcard permissions;
- return an auditable decision with the matching and deciding privileges.

## Catalog ownership

`CI_DEFAULT_ACCESS_CONTROL_DEFINITION` contains the runtime-frozen CloudIgniter
domains, resources, actions, roles, and privileges. `ciCreateAppAccessControl()`
adds application entries while rejecting collisions with core-owned entries.
Applications may add resources under core domains, add application actions to
core resources, and create roles that inherit core roles other than
`system-super-admin`. No application role may grant the dedicated core-override
capability.

Core changes are represented by immutable `CiCoreAccessControlOverride` audit
records. `ciCreateCoreAccessControlOverride()` requires a directly assigned,
system-scoped `system-super-admin`, validates the prospective catalog, and
preserves the bootstrap administration path. Persistence adapters must use
conditional revisions, step-up authentication, and immutable audit retention.

## Catalog and authorization example

```ts
import {
  ciCreateAuthorizationSubject,
  ciCreateAuthorizer,
  ciCreateRoleAssignment,
  ciDefineAccessControl,
  ciOrgUnitAccessScope,
  ciTenantAccessScope,
} from "@cloudigniter/core/lib";

const accessControl = ciDefineAccessControl({
  domains: [{ id: "identity", title: "Identity" }],
  resources: [
    {
      id: "identity.users",
      domainId: "identity",
      title: "Users",
      actions: [
        { id: "read", title: "Read users" },
        { id: "update", title: "Update users" },
      ],
      scopeKinds: ["tenant", "orgUnit"],
    },
  ],
  roles: [
    {
      id: "tenant-admin",
      title: "Tenant administrator",
      precedence: 10,
      privileges: [
        {
          id: "manage-users",
          title: "Manage users",
          effect: "allow",
          resource: "identity.users",
          action: "*",
          scopeKinds: ["tenant", "orgUnit"],
        },
      ],
    },
  ],
});

const tenantScope = ciTenantAccessScope("tenant-123");
const subject = ciCreateAuthorizationSubject(
  { id: "user-456", authenticated: true },
  [ciCreateRoleAssignment("tenant-admin", tenantScope, "descendants")]
);
const authorizer = ciCreateAuthorizer(accessControl);

const decision = authorizer.authorize({
  subject,
  resource: "identity.users",
  action: "update",
  scope: ciOrgUnitAccessScope("tenant-123", "org-unit-789", [
    "org-unit-parent",
  ]),
});
```

Lower role precedence numbers are stronger, consistent with the existing
CloudIgniter/Cognito role convention. The default `deny-overrides` algorithm
examines all applicable groups and lets any matching deny win. Applications
that intentionally want the highest applicable group to decide can create the
authorizer with `{ combiningAlgorithm: "highest-precedence" }`. Direct user
privileges form the highest tier in that mode.

## Resource catalog versus routes

Resources should be stable business capabilities such as `identity.users`,
`billing.invoices`, or `platform.settings`. A route is only one enforcement
point for a capability. The same resource/action can also protect a server
function, GraphQL resolver, job, UI control, or CLI command.

`CiRouteDefinition.access` associates a page route with one catalog
requirement without coupling the engine to a web framework:

```ts
const routes = {
  "/dashboard/users/*": {
    title: "Users",
    namespace: "users",
    protected: true,
    access: { resource: "identity.users", action: "read" },
  },
};

const allowed =
  !route.access ||
  authorizer.can({
    subject,
    scope,
    ...route.access,
  });
```

Use route metadata for page-level access such as `view` or `read`. Mutating API
handlers should declare their actual action (`create`, `update`, `delete`,
`approve`, and so on) at the operation itself. Do not make URL strings the
canonical resource IDs and do not assume that every HTTP verb has the same
business meaning.

## DynamoDB persistence strategy

Keep the core types as the storage-neutral contract and implement the DynamoDB
adapter in `@cloudigniter/aws`. Use single-table adjacency items with tenant
isolation in every partition key. The authorization request path should use the
base table; GSIs are for administration and search so eventual index
consistency cannot accidentally grant access.

Suggested item keys (`owner` is `SYSTEM`, `GLOBAL`, or `TENANT#<tenantId>`):

| Entity                   | PK                                  | SK                                      |
| ------------------------ | ----------------------------------- | --------------------------------------- |
| Catalog version          | `AUTHZ#<owner>#META`                | `VERSION`                               |
| Domain                   | `AUTHZ#<owner>#CATALOG`             | `DOMAIN#<domainId>`                     |
| Resource                 | `AUTHZ#<owner>#CATALOG`             | `RESOURCE#<resourceId>`                 |
| Role metadata            | `AUTHZ#<owner>#ROLE#<roleId>`       | `META`                                  |
| Role privilege           | `AUTHZ#<owner>#ROLE#<roleId>`       | `PRIVILEGE#<privilegeId>`               |
| Subject role assignment  | `AUTHZ#<owner>#SUBJECT#<subjectId>` | `ASSIGNMENT#<scopeToken>#ROLE#<roleId>` |
| Direct subject privilege | `AUTHZ#<owner>#SUBJECT#<subjectId>` | `DIRECT#<scopeToken>#<privilegeId>`     |

Use canonical scope tokens such as `SYS`, `GLB`, `TEN#<tenantId>`, and
`ORG#<tenantId>#<orgUnitId>`. Store `scope`, `propagation`, `validFrom`, and
`expiresAt` as structured attributes too; keys are query accelerators, not the
only representation of the policy.

Each privilege stays in its own item. This avoids rewriting a large role
document and lets an administration index search privileges directly:

```text
GSI1PK = AUTHZ#<owner>#RESOURCE#<resourcePattern>
GSI1SK = ACTION#<actionPattern>#EFFECT#<effect>#ROLE#<roleId>#PRIVILEGE#<privilegeId>
```

A reverse assignment index answers “who has this role?” and supports scope
prefix queries:

```text
GSI2PK = AUTHZ#<owner>#ROLE#<roleId>
GSI2SK = SCOPE#<scopeToken>#SUBJECT#<subjectId>
```

For one tenant request:

1. Query `AUTHZ#TENANT#<tenantId>#SUBJECT#<subjectId>` for tenant/Org Unit
   assignments and direct privileges.
2. Query `AUTHZ#GLOBAL#SUBJECT#<subjectId>` for explicitly cross-tenant grants.
3. Filter assignments against the resolved scope and grant windows.
4. Fetch the referenced role partitions in parallel, preferably from a cache
   keyed by owner, role ID, and catalog version.
5. Pass the assembled subject, roles, resource, action, and scope to the core
   authorizer.

Store Org Unit ancestry in the Org Unit model and include its stable ancestor
IDs in `CiOrgUnitAccessScope`; do not derive security ancestry from a mutable
display name or URL.

Do not persist flattened user permissions as the source of truth. Role changes
would require high-fanout rewrites and stale grants would be difficult to
revoke. A materialized decision/effective-policy cache is acceptable when it
contains the catalog and assignment versions, has a short TTL, and is
invalidated on writes. DynamoDB TTL deletion is asynchronous, so `expiresAt`
must still be checked by the evaluator. Update a policy and its version with a
transaction, and use conditional writes for assignment changes. Encryption,
audit records, and least-privileged adapter IAM permissions belong in the AWS
implementation.

Broad wildcard privileges are intentionally reported as validation warnings.
They make new resources or actions reachable without editing the role, so use
literal privileges for sensitive operations.

## Design references

- [NIST role-based access control](https://csrc.nist.gov/projects/role-based-access-control)
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [DynamoDB data-modeling building blocks](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/data-modeling-blocks.html)
