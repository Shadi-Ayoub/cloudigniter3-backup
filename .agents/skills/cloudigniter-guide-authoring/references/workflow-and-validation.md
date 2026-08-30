# Workflow and Validation

Use this reference for every CloudIgniter guide task.

## Documentation surfaces

| Surface | Location | Docusaurus plugin/sidebar | Primary audience |
| --- | --- | --- | --- |
| CloudIgniter Users | `developer-guide/docs` excluding `api-reference` | Default docs plugin / `userGuideSidebar` | Application developers, integrators, and operators |
| CloudIgniter Developers | `developer-guide/company-developers` | `companyDevelopers` plugin / `cloudIgniterDevelopersSidebar` | CloudIgniter contributors and provider/package maintainers |
| Dictionary | `developer-guide/dictionary` | `dictionary` plugin / `dictionarySidebar` | Readers looking up stable CloudIgniter ecosystem terminology by letter |
| API Reference | `developer-guide/docs/api-reference` | Default docs plugin / `apiReferenceSidebar` | Developers looking up stable public contracts |
| Skills | `.agents/skills` and `.codex/skills` (rendered through generated build content) | Skills docs plugin / `skillsSidebar` | Codex and maintainers inspecting reusable authoring instructions |

Respect the plugin boundary. Links into `company-developers` use that plugin's route base; API reference pages remain under the default docs plugin.

## Determine documentation impact

Use the following as a minimum routing matrix:

| Code change | Required documentation review |
| --- | --- |
| New application-facing capability or workflow | CloudIgniter Users and API Reference; CloudIgniter Developers when new architecture or extension rules are introduced |
| Public function, component, hook, type, class, constant, or package entry point | API Reference and every user guide that teaches the affected workflow |
| Configuration field, default, environment variable, or lifecycle rule | CloudIgniter Users; API Reference for a public typed contract; CloudIgniter Developers for internal resolution/wiring |
| Package ownership, dependency direction, provider binding, request lifecycle, or rendering architecture | CloudIgniter Developers, the affected user workflow, and the matching `cloudigniter-development` reference |
| Provider integration | CloudIgniter Users for setup/usage; CloudIgniter Developers for provider implementation; API Reference for public adapters/contracts |
| UI component or user-facing behavior | CloudIgniter Users and API Reference for reusable public components |
| New, renamed, or materially changed stable ecosystem term | Dictionary and every guide surface that teaches the concept |
| Deprecation, rename, removal, or breaking behavior | Every page using the old contract, API Reference migration notes, and compatibility guidance |
| Bug fix that changes observable behavior | Correct the pages that described or worked around the old behavior; add troubleshooting guidance when the failure mode is likely to recur |
| Internal refactor with identical documented behavior | Verify all three surfaces; record why no guide edit is needed if none is affected |
| Skill or skill reference change | The Skills tab updates from its source folders; improve the source skill only when warranted, without copying it into the guide |

## Establish the source of truth

Verify documentation in this order:

1. Public package exports and package `exports` maps.
2. Current types, runtime implementation, and configuration schemas.
3. Focused tests and fixtures that establish behavior and edge cases.
4. Application/template consumers that demonstrate supported composition.
5. Repository architecture references and decisions.
6. Existing guide pages.

Treat existing guide text as evidence to reconcile, not as authoritative source. Search all consumers before documenting a rename or removal. Do not teach deep imports or internal package paths unless the page is explicitly contributor-facing.

## Inspect before editing

Use Graphify first for codebase relationships when `graphify-out/graph.json` exists. Then confirm the relevant source directly.

Search at minimum for:

- the changed symbol, configuration key, route, component, or concept across source and guide;
- canonical `/client`, `/server`, `/lib`, and `/types` entry points;
- package `exports` declarations and barrel files;
- tests that demonstrate success, denial, fallback, error, and compatibility behavior;
- existing category metadata, sidebar placement, index pages, and cross-links;
- old names, aliases, imports, and examples that must change together.

## Shared authoring standards

- Spell the product name `CloudIgniter`.
- Write for the selected audience and state prerequisites rather than assuming hidden repository knowledge.
- Prefer outcome-first explanations and runnable, minimal examples.
- Use exact current imports, file paths, type names, configuration keys, defaults, and runtime boundaries.
- Distinguish client, server, shared, build-time, and provider-specific APIs.
- Explain meaningful failure modes, security constraints, and compatibility behavior.
- Use frontmatter with a concise `title`, useful `description`, and intentional `sidebar_position` for new MDX pages.
- Preserve established directory terminology and update `_category_.json` when the label, description, or ordering changes.
- Prefer relative guide links that Docusaurus validates. Cross-link concepts, tutorials, contributor architecture, and API pages.
- Use Mermaid only when sequence, ownership, hierarchy, or data flow is materially clearer than prose.
- Avoid duplicating long source code. Show the smallest example that teaches supported use.
- Do not claim an API is stable, public, or supported unless it is reachable from an intentional package entry point.
- Do not present application-template customization as reusable package behavior.

## Validation sequence

1. Review changed pages alongside the implementation diff.
2. Verify every code block and import against source and package entry points.
3. Verify navigation, category placement, titles, and related links.
4. Search for stale symbols and paths across all three guide surfaces.
5. Run:

```bash
pnpm --filter developer-guide typecheck
pnpm --filter developer-guide build
```

6. Run focused code tests that substantiate documented behavior when they were not already run for the implementation.
7. Run `graphify update .` after code or architecture-document changes, following repository instructions.

The Docusaurus build is mandatory because it catches invalid MDX, unresolved imports, duplicate routes, invalid sidebars, and broken links that a prose review misses.

## Final review and report

Report:

- changed behavior and implementation source of truth;
- affected audiences and guide pages;
- public entry points documented;
- navigation changes;
- validation performed;
- any remaining documentation debt or suggested authoring improvement.

Do not treat successful Docusaurus compilation as proof that the content is technically correct. Validate both structure and claims.
