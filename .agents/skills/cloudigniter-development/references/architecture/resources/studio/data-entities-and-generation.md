# Data Entities and Generation

Use this reference for Resource Studio descriptors, Amplify Data contracts, generated artifact ownership, management pages, and Tenant/global scope behavior.

## 4. Preserve the Data Entity and Amplify contract

Normalize every descriptor to schema version `1`, kind `data-entity`, and provider `aws-amplify`. Require a stable lowercase kebab-case resource ID, PascalCase singular and plural names, `tenant` or `global` scope, and a static absolute logical management path.

V1 creates one Amplify-managed `a.model(...)` Data Store per Data Entity. Supply and reserve:

- `PK` and `SK` as `identifier(["PK", "SK"])`;
- `id` as the application record identifier;
- `ciScopeKey` and `ciSortKey` for bounded listing;
- Amplify-managed `createdAt` and `updatedAt` timestamps.

Accept the Amplify scalar catalog exposed by `CI_AWS_RESOURCE_STUDIO_CAPABILITIES`: `ID`, `String`, `Int`, `Float`, `Boolean`, `AWSDate`, `AWSTime`, `AWSDateTime`, `AWSTimestamp`, `AWSEmail`, `AWSJSON`, `AWSPhone`, `AWSURL`, and `AWSIPAddress`. Preserve required, array, array-item-required, supported default, and type-compatible validation semantics. Reject duplicate or reserved custom fields.

Support model authorization strategies `authenticated`, `guest`, `publicApiKey`, `owner`, `ownerDefinedIn`, `ownersDefinedIn`, `group`, `groups`, `groupDefinedIn`, `groupsDefinedIn`, and `custom`, with only compatible providers, claims, fields, groups, and operation subsets. When no rule is supplied, use the V1 administration default: all CRUD operations for `system-admin` and `system-super-admin`. Treat route scope and model authorization as separate controls.

Always reserve the `byScope` GSI over `ciScopeKey` and `ciSortKey` and list through its named, paginated Query. Never generate a request-path Scan. Permit at most 19 additional GSIs, require each to serve a named access pattern, and validate key types, names, query fields, projections, and included attributes. Document eventual consistency, write/storage cost, and possible sandbox table replacement for every index change.

Build persisted keys only with CloudIgniter's canonical `CI#...` helpers. Do not accept a Tenant ID or system key from the browser.

## 5. Generate only registered artifacts

For entity `<id>`, generate backend source only at:

```text
amplify/custom/data/schemata/data-entities/<id>/entity.ci.json
amplify/custom/data/schemata/data-entities/<id>/schema.generated.ts
amplify/custom/data/schemata/registry.generated.ts
```

Generate frontend source only at:

```text
src/app/(ci-tenant)/ci-tenant/(ci-custom)/<logical-path>/
src/app/(ci-global)/ci-global/(ci-custom)/<logical-path>/
  page.tsx
  Ci<Plural>Manager.tsx
  actions.generated.ts

src/custom/routes/resource-studio.generated.ts
```

Treat `entity.ci.json` as the portable source for later edits. Sort descriptors deterministically and rebuild shared generated registries from the complete descriptor set. Never edit or patch generated output manually; change the descriptor and re-plan it. Keep manual custom registries separate from generated registries.

## 6. Preserve frontend and Tenant-scope behavior

Suggest `/dashboard/<plural-kebab-case>` as the management path but allow another static logical path. Reject route parameters, trailing slashes, `(system)`, internal `/ci-tenant` or `/ci-global` prefixes, and public `/t/...` prefixes. Require logical route uniqueness across both scopes.

Place a Tenant entity under `(ci-tenant)/ci-tenant/(ci-custom)` and a Global entity under `(ci-global)/ci-global/(ci-custom)`. Generate a protected route with the matching `tenantScopes` restriction. Recheck the resolved scope in the page and every server action.

Generate native Amplify Data create, get, update, delete, and named-GSI list calls. Build IDs and keys on the server, cap pagination, normalize thrown errors, and return serializable mutation results. Do not confuse model operations with DynamoDB `SET` or `PUT` terminology.

Generate `Ci<Plural>Manager.tsx` beside the page. It must use `CiDataEntityManager` and render `CiDataTable`, while preserving shared loading, empty, mutation-feedback, confirmation, responsive, accessibility, and action-stability conventions.

## Related references

- [Resource Studio overview](overview.md)
- [Transactions](transactions.md)
- [Deployment and security](deployment-and-security.md)
- [Validation](validation.md)
