# API Reference Section

Use this reference for stable public programmatic contracts in `developer-guide/docs/api-reference`.

## Scope

Document APIs intentionally exposed to CloudIgniter consumers, including:

- functions and helpers;
- React components and hooks;
- classes and methods;
- public types, interfaces, unions, and configuration contracts;
- constants and registries intended for consumers;
- client, server, shared, provider, and framework entry points;
- deprecations, aliases, removals, and migration paths.

Do not document internal helpers as public merely because another repository file imports them. Confirm the symbol is reachable through an intentional package `exports` entry and barrel.

## Verify the public contract

Before editing a page:

1. Inspect the owning package's `package.json` `exports` map.
2. Inspect the canonical barrel for `/client`, `/server`, `/lib`, or `/types`.
3. Read the implementation and complete type definition.
4. Read tests for defaults, validation, errors, and edge cases.
5. Search consumers for the supported usage pattern.
6. Search the guide for stale aliases, signatures, and import paths.

For EmberGuard, follow the current `AGENTS.md` public-facade rules rather than assuming the internal package is consumer-facing.

## Information architecture

Place pages by contract and runtime:

- `client-apis` for browser-safe functions and hooks;
- `server-apis` for server-only functions and integrations;
- `shared-apis` for runtime-neutral helpers;
- `components` for reusable public UI contracts;
- `classes` for class-based APIs;
- `type-definitions` for public types and configuration contracts;
- `authorization` for public authorization contracts;
- `http-data-apis` for HTTP/data processing surfaces;
- `trace-diagnostic` for public diagnostics.

Extend the taxonomy only when a new public domain cannot be placed accurately. Update `_category_.json`, overview pages, and table-of-contents pages when categories or coverage change.

## Recommended function or method page

Include the applicable sections:

1. Purpose and runtime classification.
2. Package and exact import path.
3. TypeScript signature.
4. Parameters, including optionality and defaults.
5. Return type and meaningful result fields.
6. Thrown errors, denial behavior, and side effects.
7. Minimal supported example.
8. Constraints, security notes, compatibility, and deprecation status.
9. Related APIs and concept guide.

Use tables for repeated parameter or field mappings. Do not restate obvious type syntax in prose.

## Recommended component or hook page

Document:

- client/server requirement;
- import path;
- props or arguments and defaults;
- controlled and uncontrolled behavior where applicable;
- callbacks and callback context;
- state, loading, empty, error, accessibility, and responsive behavior;
- extension points and underlying-library interop;
- a minimal example and a realistic composition example when needed.

## Recommended type or configuration page

Document:

- owning package and `/types` import;
- the complete current shape or union;
- field meaning, requiredness, defaults, and constraints;
- relationships to resolver or runtime behavior;
- compatibility and extension rules;
- a valid minimal object using `satisfies` when useful.

## API change rules

- Add reference coverage with every new public symbol or public configuration field.
- Update every affected page when a signature, default, field, runtime boundary, or import path changes.
- Mark deprecated APIs with the replacement and migration example.
- Remove or archive documentation when a public API is removed; do not leave examples that compile only through stale aliases.
- Document experimental status explicitly and avoid stability claims not backed by repository policy.
- Cross-link from user guidance; do not turn reference pages into long tutorials.

## Completeness checklist

- Is the symbol exported from the documented path?
- Does the signature match current source exactly?
- Are generics, overloads, optional fields, defaults, and return types represented?
- Are runtime and provider constraints explicit?
- Are errors, denials, mutations, and side effects documented?
- Does the example use supported imports and realistic values?
- Are related index, overview, and table-of-contents pages current?
- Were renamed or removed symbols searched across the entire guide?
