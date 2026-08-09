# Public API and Runtime Boundaries

Use this reference when changing types, exports, modules, dependencies, or client/server code.

## Table of contents

1. Canonical public entry points
2. Type placement
3. Runtime boundaries
4. Dependency direction
5. Compatibility
6. Modules
7. Export validation

## Canonical public entry points

Use intentional package entry points:

```text
@cloudigniter/<package>/client
@cloudigniter/<package>/server
@cloudigniter/<package>/lib
@cloudigniter/<package>/types
```

- `/client`: browser-safe components, hooks, and helpers.
- `/server`: server-only integrations and privileged runtime behavior.
- `/lib`: runtime-neutral reusable helpers.
- `/types`: the package's canonical public types.

Do not expose an internal helper merely because another file needs it. Prefer a stable higher-level capability and keep implementation details private.

## Type placement

Before adding a public type:

1. Search for an equivalent type.
2. Identify its public API owner.
3. Place it in the established domain under `src/types`.
4. Export it from the domain barrel.
5. Export it from the package `/types` barrel.
6. Import it through the public `/types` entry point from consumers.

All public platform/provider-agnostic EmberGuard types must be available from `@cloudigniter/core/types`.

Keep private implementation-only types colocated. Do not create a public type solely to avoid a proper import.

## Runtime boundaries

Before adding an import to client code, inspect its transitive graph. Client modules must not reach:

- `server-only` or `next/headers` modules;
- Node.js filesystem/process APIs that are not browser-safe;
- provider server SDKs;
- secrets or privileged configuration;
- server-side session or persistence implementation.

Do not add `"use client"` to hide an ownership mistake. Move shared logic to a runtime-neutral location and keep browser/server adapters separate.

## Dependency direction

Avoid these dependencies:

```text
core       → next
core       → provider implementation
emberguard → next
emberguard → provider implementation
package    → apps/template
ui         → apps/template
```

Inspect the existing package graph before adding a dependency. Use contracts, adapters, callbacks, or dependency injection when direct imports would invert ownership or create cycles.

## Compatibility

Treat exported functions, types, components, configuration, and entry points as public contracts.

Before changing one:

1. Search every consumer.
2. Understand current runtime semantics.
3. Prefer additive evolution.
4. Preserve defaults when practical.
5. Update all consumers for an intentional breaking correction.
6. Document the compatibility impact.

## Modules

Follow established module concepts such as:

```text
manifest
client
server
lib
types
```

Internal module structure is not automatically a public import path. Expose only intentional package APIs.

## Export validation

When a public API changes:

- update the source barrel;
- update package exports/build configuration if necessary;
- verify the intended external import;
- search for stale or deep imports;
- typecheck the owner and at least one consumer;
- confirm client entry points do not expose server dependencies.
