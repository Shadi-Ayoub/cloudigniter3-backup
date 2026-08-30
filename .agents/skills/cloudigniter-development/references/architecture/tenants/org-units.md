# Org Unit Trees and Tenant Sharing

Use this reference for Org Unit management, shared subtrees, tenant attachments, routing lookup, seeding, or hierarchy-aware authorization.

## Domain model

- An Org Unit has one stable global identity and one immutable slug. A system administrator may move its complete subtree to another parent or tree through the explicit atomic move contract.
- A node is attached to one or more tenants. The same canonical node and subtree may therefore be reused by several tenants without duplicating IDs.
- Every child's tenant set must be a subset of its direct parent's tenant set. Enforce the same rule against direct children before detaching a tenant from a parent.
- Store authoritative predecessor IDs from the root to the direct parent. Never infer them from a client pathname.
- Edit name, description, status, and tenant attachments optimistically. Re-parent only through the update contract's explicit `parentId`: reject self/descendant cycles and tenant-incompatible parents, then atomically rewrite canonical paths, predecessor arrays, GSI projections, tenant/path attachments, and both parent child collections. Fail without partial writes when the subtree exceeds the 100-operation transaction bound. Slug remains immutable.
- Treat the provider's returned row as authoritative, but require its `parentId` to match every explicitly requested move destination before presenting success or updating client state. Reject a mismatch as backend version skew so an older deployed handler cannot turn an ignored `parentId` into a false-success move.

## Explorer interaction

- Alphabetize sibling Org Units by displayed name while preserving their hierarchy and predecessor order.
- Support re-parenting through both the Edit dialog and drag-and-drop. Use a dedicated 44px move handle with pointer capture, a small activation threshold, and hit-tested node/root targets; do not make the complete context-menu tree row a native HTML `draggable` surface. This keeps mouse, pen, and touch behavior independent of browser-specific `DataTransfer` and nested-control behavior.
- Keep the Edit path as the complete keyboard-accessible alternative. Validate self, descendant, unchanged-parent, and tenant-incompatible moves before confirmation, then authorize and validate again in the trusted mutation.
- Show the shared time-limited `CiNewResourceBadge` for newly created Org Units.

## System-table access patterns

Keep Org Units in the existing System-table bounded context:

- canonical node: `PK = CI#SYSTEM#ORG_UNIT#<id>`, `SK = CI#META`;
- management collection: `GSI1PK = CI#SYSTEM#ORG_UNITS` with path-ordered `GSI1SK`;
- child collection: `GSI2PK = CI#SYSTEM#ORG_UNIT_CHILDREN#<parent-or-ROOT>`;
- authoritative tenant/path attachment: `PK = CI#SYSTEM#TENANT#<tenantId>#ORG_UNITS`, `SK = CI#PATH#<path>`.

Routing uses a strongly consistent base-table `GetItem` on the attachment. Management listing uses the bounded GSI query. Creation, attachment changes, and bounded subtree moves use transactions with tenant existence, path uniqueness, parent version, and node version conditions. Move discovery uses strongly consistent `GetItem`/`BatchGetItem` reads through stored child IDs and never scans.

## Authorization

Construct Org Unit access scopes with `ciOrgUnitContextAccessScope()` or `ciOrgUnitAccessScope()` only after provider/framework code resolves the tenant attachment and predecessor IDs. An `exact` assignment applies only to its node. A `descendants` assignment applies when its Org Unit ID occurs in the authoritative request node's `ancestorOrgUnitIds`. Tenant IDs must also match, including when a canonical node is shared by several tenants.

The core `platform.org-units` resource separates `read`, `create`, `update`, `share`, and `archive`. Recheck the resource/action and resolved scope at every trusted mutation boundary; UI capabilities are presentation hints only.

## Development seeding

Tenant fixtures may contain parent-first `orgUnits`. Create tenants before nodes. Give every canonical Org Unit its own marker in the same seeder partition and delete seeded nodes deepest-first before deleting tenants. Cleanup must remove all tenant/path attachments with the canonical node and marker conditionally, prune the deleted child from its predecessor, and preserve any node with surviving children.
