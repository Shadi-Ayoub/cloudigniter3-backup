# CloudIgniter Users Section

Use this reference for application-developer, integrator, and operator guidance in `developer-guide/docs`, excluding `developer-guide/docs/api-reference`.

## Audience and purpose

Assume readers consume CloudIgniter through supported package entry points and application configuration. Teach them how to achieve an outcome safely without requiring knowledge of package internals.

Cover:

- concepts and mental models needed to use a capability;
- setup, configuration, and extension points;
- task-oriented tutorials and end-to-end workflows;
- provider-specific setup when the provider affects application usage;
- user-visible defaults, behavior, constraints, and troubleshooting;
- migration steps for renamed, deprecated, or removed behavior;
- links to exact API reference pages for field-level details.

Keep internal package implementation, maintainer-only invariants, and unpublished extension mechanics in CloudIgniter Developers.

## Choose or create the page

Search the existing concept and workflow hierarchy before adding a page. Prefer updating the page a reader would already visit.

Common homes include:

- `docs/bootstraping-cloudigniter` for root/page bootstrapping and runtime composition;
- `docs/core-system` for core concepts, configuration, tenancy, settings, and authorization workflows;
- `docs/providers` and `docs/aws-amplify-setup` for provider setup and application integration;
- `docs/ui-components` for reusable UI workflows;
- `docs/internationalization`, `docs/theme-system`, `docs/error-handling`, and similar focused domains;
- `docs/dictionary` only for stable terminology, not complete tutorials.

Update `_category_.json` when a new capability changes discoverability or order. Avoid adding a second category for an existing concept under a slightly different name.

## Recommended page structure

Adapt the structure to the task; do not force empty sections.

1. State the reader outcome and when the capability applies.
2. Explain the minimum mental model and prerequisites.
3. Show the supported setup or configuration.
4. Provide a runnable example using public imports and application-owned files.
5. Explain important defaults, lifecycle behavior, and extension points.
6. Cover security constraints, edge cases, errors, and troubleshooting.
7. Link to related concepts, provider guidance, and API reference pages.

For multi-step capabilities, provide a learning path and keep each page focused. For simple behavior, prefer one concise page over a fragmented series.

## Examples and imports

- Use the application template only to demonstrate supported composition.
- Import reusable APIs from intentional package entry points such as `/client`, `/server`, `/lib`, or `/types`.
- Use realistic application paths while making it clear which files are application-owned.
- Include expected output or decision behavior when it removes ambiguity.
- Demonstrate failure or denial paths for security-sensitive and validation-sensitive features.
- Do not expose internal `src` paths or ask application developers to import internal capability packages when the public facade owns the API.

## Quality checklist

- Can a reader identify why and when to use the capability?
- Does the example compile against current exports and types?
- Are configuration defaults and required fields accurate?
- Are server/client/provider boundaries explicit?
- Are common failure modes actionable?
- Does the page link to the exact public contracts rather than reproducing a large reference table?
- Are renamed concepts and old imports removed from related pages?
- Is the next useful step discoverable?
