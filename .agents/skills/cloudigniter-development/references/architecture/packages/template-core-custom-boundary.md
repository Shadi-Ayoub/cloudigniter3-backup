# Template Core and Custom Boundary

Use this reference whenever work adds, moves, generates, updates, deletes, or reviews code in `apps/template`, or designs an application-facing generator. The boundary is mandatory for new work even while older template-local platform implementation is being migrated.

Read [package ownership](ownership.md) for the package/application split and the [resources overview](../resources/overview.md) for Resource Studio generation and deletion lifecycles.

## Ownership lanes

Classify every affected file before editing it:

| Lane | Owner | Rule |
| --- | --- | --- |
| Package core | CloudIgniter maintainers | Reusable behavior belongs in its owning package (`core`, `next`, provider, `ui`, or `cli`), never copied into the template. |
| Template core | CloudIgniter maintainers | Framework entry points, default composition, provider selection, and other thin bindings may remain in `apps/template`; upgrades may replace them. |
| Manual application custom | Application developer | New application implementation belongs only in `amplify/custom/**`, `src/custom/**`, or a scoped `(ci-custom)` App Router tree. |
| Generated application custom | A registered generator | Output is confined to generated-owned entity folders and generated registries within the manual custom seams. |
| Machine-local tooling | Local operator/tool | Credentials, session state, and transaction journals stay under ignored local state and are never imported by the application. |

The only supported application-owned page roots are:

```text
apps/template/src/app/(ci-global)/ci-global/(ci-custom)/**
apps/template/src/app/(ci-tenant)/ci-tenant/(ci-custom)/**
```

Do not put application-owned pages under `(system)`. Do not add new application/provider code beside core schemas, core functions, kernel implementation, or core route definitions merely because older examples exist there.

## Thin composition exception

A template-core file may bridge package core and custom inputs only when a framework or provider requires one application entry point. The bridge must:

- import stable package APIs and one or more explicit custom registries/hooks;
- contain only configuration, selection, strict merging, or delegation;
- remain CloudIgniter-managed and free of application business logic;
- reject duplicate keys instead of giving custom code implicit override precedence.

Examples include root route composition, Amplify schema composition, and Amplify backend composition. Application developers edit the custom registry or hook, not the bridge.

If another CloudIgniter application would need substantially the same algorithm, the bridge is too thick. Move the behavior to its package owner first.

## Generator contract

An application-facing generator must have an explicit ownership manifest or deterministic equivalent. It may rewrite only:

- the resource folder it already owns;
- a new resource folder whose complete target set has passed collision checks;
- shared files explicitly designated as generated registries.

It must never rewrite:

- manual custom registries or hand-written siblings;
- template-core bridges or package source;
- another resource's folder;
- an existing unregistered path based only on a matching filename or comment.

Before any mutation, validate resource IDs, model/schema keys, backend keys, globally unique logical route keys, and every target path against core, manual custom, other generated resources, and filesystem state. Any ambiguity or collision fails the operation. Never silently merge by object spread, select “last writer wins,” or adopt a hand-written file as generated-owned.

Use a confined, journaled multi-file transaction for generator apply, update, drop, and local rollback. Rollback must verify all expected after-images before changing any target. A cloud deployment is outside the local file transaction and requires a separately authorized compensating deployment; it is never described as a data rollback. Before a generated-resource deploy, require a short-lived, single-use intent bound to the exact generated-plan hash, explicit deployment selection, and verified provider identity/Region, then recheck every binding immediately before the provider subprocess.

## Upgrade invariant

Design template releases so core/package updates can replace CloudIgniter-managed files while preserving the three custom code seams. After an upgrade:

1. preserve manual and generated application custom paths;
2. compose them through the current thin core bridges;
3. regenerate only through the owning generator when its format changes;
4. fail and require a migration when a new core key or route collides with custom code.

Do not solve upgrade compatibility by copying core source into `custom`, by letting custom code shadow core, or by teaching generators to patch arbitrary template files.

## Review and validation

- List every changed template path with its ownership lane.
- Search for equivalent package behavior before accepting a template implementation.
- Verify that user-authored/generated code stays within the supported custom seams.
- Test duplicate core/custom/resource keys and route/path collisions as failures.
- Test create, update, drop, apply drift, rollback drift, and exact before-image restoration for generators.
- Confirm local state and credentials are ignored and excluded from publish/build inputs.
- Validate the package owner, thin template consumer, and an upgrade-like composition with existing custom artifacts.

Existing boundary violations are migration debt. Document and reduce them in focused changes; never cite them as justification for adding another one.
