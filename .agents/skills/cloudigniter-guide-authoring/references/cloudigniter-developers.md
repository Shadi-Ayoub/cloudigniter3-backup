# CloudIgniter Developers Section

Use this reference for contributor-facing documentation in `developer-guide/company-developers`.

## Audience and purpose

Write for maintainers of CloudIgniter packages, provider implementations, framework integrations, and reusable capabilities. Explain how the system is built, why boundaries exist, and how to extend it without violating architecture.

Cover:

- package ownership and dependency direction;
- public facade versus internal implementation boundaries;
- client, server, build-time, provider, and framework runtime separation;
- end-to-end request, rendering, build, deployment, and persistence flows;
- extension points, registration contracts, adapters, providers, and manifests;
- invariants, failure modes, compatibility constraints, and validation strategy;
- contributor workflows for adding a package capability or provider implementation.

Keep application-facing setup and tutorials in CloudIgniter Users. Keep exhaustive public signatures in API Reference.

## Architecture synchronization

When architecture changes, update all three sources in the same change:

1. implementation and tests;
2. the focused `.agents/skills/cloudigniter-development/references/*.md` architecture reference;
3. the relevant CloudIgniter Developers page.

Use the repository skill reference as concise agent guidance and the developer-guide page as the fuller human explanation. Keep terminology and lifecycle diagrams consistent without copying entire files verbatim.

## Choose or create the page

Organize by architectural domain rather than by the task or pull request that introduced it.

Current contributor documentation begins under:

- `company-developers/providers` for provider architecture and binding workflows.

Create focused categories as contributor coverage expands, for example package architecture, runtime lifecycle, public API governance, testing, or release workflows. Reuse an existing domain category when possible.

## Recommended architecture page structure

1. State the capability, architectural problem, and owning layer.
2. Define responsibilities and explicit non-responsibilities.
3. Show the end-to-end flow or dependency direction.
4. Map important packages, entry points, registries, adapters, and application bindings.
5. Explain the supported extension workflow in implementation order.
6. List invariants, validation rules, and prohibited shortcuts.
7. Cover failure modes, diagnostics, tests, and compatibility considerations.
8. Link to user guidance and public API references.

Use a table for exact ownership mappings and Mermaid for flows involving at least three meaningful stages. Prefer prose for a single rule.

## Contributor examples

- Use real package boundaries and current filenames.
- Distinguish conceptual pseudocode from copyable code.
- Explain why a template file remains thin when reusable behavior lives in a package.
- Identify the public entry point separately from the internal implementation location.
- Document registration and export steps that are easy to omit.
- Include the affected validation chain, not only a single package build.

## Quality checklist

- Is ownership consistent with `AGENTS.md` and `cloudigniter-development`?
- Does the page show dependency direction and runtime boundaries?
- Are implementation details clearly separated from supported public contracts?
- Does the extension workflow identify every required registry, export, binding, and test?
- Are security, lifecycle, provider, and compatibility invariants explicit?
- Does the page explain how to validate the complete affected chain?
- Are user-facing steps and API signatures linked rather than duplicated?
