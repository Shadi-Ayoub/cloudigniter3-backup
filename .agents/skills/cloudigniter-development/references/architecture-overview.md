# CloudIgniter Architecture Overview

Use this reference for broad architecture, dependency direction, and the template-versus-package boundary; use [page-rendering.md](page-rendering.md) for the root-layout, route-layout, page, bootstrap, and provider hierarchy.

## System model

```text
apps/template
    application composition, configuration, routes, framework entry points
                         │
                         ▼
packages/next ───────────────────────── provider package (for example packages/aws)
    Next.js integration, runtime                provider-specific implementation
    orchestration, provider binding
                         │
                         ▼
packages/core
    stable public generic API and public types
                         │
                         ▼
packages/emberguard
    internal generic security capability implementation

packages/ui
    reusable presentation primitives and shared UI behavior
```

The diagram describes responsibility. Confirm actual package dependencies before adding an import and never introduce a cycle merely to mimic the diagram.

## Architectural rules

- Place behavior at the lowest layer that can own it without depending on a more specialized layer.
- Keep framework-independent code out of `packages/next`.
- Keep Next.js request and response behavior out of `packages/core` and `packages/emberguard`.
- Keep provider selection and provider-specific structures out of generic packages.
- Never make a package depend on `apps/template`.
- Keep reusable UI out of the template and application-specific content out of reusable UI.
- Treat runtime boundaries as architecture: browser code must not transitively import server-only modules, credentials, filesystem APIs, or server SDKs.

## Template boundary

`apps/template` may contain:

- `next.config.ts` and other framework composition;
- the application `proxy.ts` entry point and matcher;
- application route definitions;
- application/provider selection and configuration;
- application-specific locale registries and overrides;
- route/page composition and replaceable application content.

It must not accumulate reusable:

- route, request-context, or middleware algorithms;
- generic authentication or authorization logic;
- provider implementations;
- shared UI components;
- public CloudIgniter contracts.

Use this test when editing the template:

> Is this code configuring or composing CloudIgniter, or implementing CloudIgniter?

If another CloudIgniter application would need substantially the same implementation, place it in the appropriate package and let the template delegate to it.

## Configuration boundary

Use application configuration to select or customize reusable capabilities. Packages may accept configuration, contracts, adapters, callbacks, or providers; they must not import the template to discover values.

Keep configuration responsibilities distinct:

- `next.config.ts`: Next.js build/framework/plugin composition;
- `cloudigniter.config.ts`: application CloudIgniter capability configuration;
- `routes.ts`: application route registry and metadata;
- `proxy.ts`: request-time application entry point that supplies configuration to reusable Next.js handling.

Do not move request-time business logic into `next.config.ts`, and do not use framework configuration as a second CloudIgniter configuration store.

## Architecture smells

Reconsider the design when you find:

- generic helpers under `apps/template`;
- equivalent types in multiple packages;
- deep imports into another package's `src` tree;
- generic EmberGuard imports from `packages/emberguard` in application code;
- AWS/Cognito terminology in generic core contracts;
- Next.js imports in generic packages;
- server imports reachable from a client entry point;
- route registries, complete configuration, or message catalogs serialized into request context;
- a template entry point containing reusable orchestration instead of delegating to a package.

## Preferred end state

```text
generic/internal behavior
        → stable public contract
        → framework integration
        → provider implementation where needed
        → thin application composition
```
