# EmberGuard Layering

Use this reference for authentication, authorization, actors, identities, sessions, roles, permissions, policies, scopes, assignments, claims, or provider mapping.

Read the [access-control overview](../access-control/overview.md) for catalog, permissions, roles, assignments, administration, and validation details; use [public API and runtime boundaries](../packages/public-api-and-runtime.md) for exposed helpers and types.

## Responsibility chain

```text
packages/emberguard
    internal generic capability implementation
            ↓ exposed through
packages/core
    stable public generic helpers and all public types
            ↓ implemented/wired for Next.js by
packages/next
    request/session integration and selected-provider orchestration
            ↕
packages/aws or another provider
    provider-specific implementation
            ↓ consumed by
apps/template
    provider selection, configuration, and application composition
```

## Public API rule

Application code should normally import generic EmberGuard APIs from:

```text
@cloudigniter/core/lib
@cloudigniter/core/types
```

Do not require consumers to import generic public contracts from `@cloudigniter/emberguard`.

## Implementation rules

- Keep generic policy/authorization algorithms inside `packages/emberguard` when they are internal capability behavior.
- Surface supported generic behavior through `packages/core` without creating dependency cycles.
- Put Next.js request/session extraction and provider orchestration in `packages/next`.
- Put Cognito group/claim mapping and AWS operations in `packages/aws`.
- Keep provider selection and application overrides in the template/configuration layer.
- Normalize provider results into generic contracts before exposing them to application code.

## Do not

- put Next.js request handling in `packages/emberguard`;
- bind AWS in `packages/core`;
- leak Cognito-specific claims into generic role or permission contracts;
- implement complete reusable security administration in `apps/template`;
- expose internal EmberGuard helpers simply for convenience;
- trust client-controlled request-context cookies as authorization evidence without authoritative validation.

## Review checklist

- Are public generic types exported from `@cloudigniter/core/types`?
- Are generic helpers exposed through an intentional `core` API?
- Is provider-specific behavior isolated?
- Is Next.js orchestration located in `packages/next`?
- Does application code avoid EmberGuard internals?
- Does the dependency graph remain acyclic?
