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

## Package references by audience

Write the Dictionary, CloudIgniter Users, API Reference, and other end-user guide content for readers who have
the application template from GitHub and CloudIgniter packages from npm. Refer to packages by their published
`@cloudigniter/<name>` names, including in definitions, prose, tables, diagrams, and code comments. Keep repository
package paths such as `packages/<name>` and package implementation details in CloudIgniter Developers, whose
audience is system developers at the company that owns CloudIgniter. Source skills rendered in the Skills tab
retain their maintainer instructions and repository paths.

For example, identify EmberGuard as `@cloudigniter/emberguard` while continuing to direct application developers
to supported generic APIs through `@cloudigniter/core`. Naming a package does not make its internal modules
supported application imports. Check all end-user guide surfaces for repository package paths when updating
package references; preserve valid internal paths in CloudIgniter Developers.

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

## Docusaurus edit lifecycle

Apply this sequence whenever changing guide content, navigation, components, configuration, or source skills
rendered in the Skills tab:

1. Before the first edit, identify this checkout's Docusaurus development server and its terminal/process.
   The guide's `start` script uses port `3010`; check `developer-guide/package.json` and any explicit launch
   arguments for a different port. If no guide server is running, proceed with it stopped.
2. Stop the confirmed guide server gracefully through its owning terminal/session, or send a termination
   signal to its verified process. Confirm it has exited and released the guide port before writing files.
   Do not stop unrelated Next.js applications, other checkouts, or all Node processes.
3. Keep Docusaurus stopped throughout the update, including source-skill edits, page-date refreshes,
   generated-content/cache cleanup, typechecking, and the production build. The guide's start/build hooks
   clear generated metadata, so do not run these checks alongside an active development server.
4. After the edits and required checks finish, start the guide from the repository root with
   `pnpm --filter developer-guide start --no-open` (or `pnpm start --no-open` inside `developer-guide`).
   Preserve an explicitly configured host/port and keep the server in a managed terminal/session that
   remains running after the task. Start it even if it was already stopped when work began, unless the user
   explicitly asks to leave it stopped.
5. Wait for successful startup, then request the local guide URL and an affected page to verify successful
   HTTP responses. Report the URL and any startup failure accurately. If more edits or cache-clearing checks
   are needed after startup, stop the server again before continuing and restart after those checks.

Read-only guide inspection does not require stopping Docusaurus.

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

## Navigation and page retirement

- Maintain `developer-guide/user-guide-structure.json` as the Users chapter and archive membership source.
- Keep each Users document in exactly one current chapter or archive group. Keep the API Reference in its own sidebar.
- Classify obsolete guidance from the current implementation and exports, not file age alone. Correct local drift in otherwise useful pages.
- Put superseded pages under **Obsulete** with a clear historical notice, reason, and current replacement. Preserve their URLs when practical.
- Before removing or moving a source, search Users, Dictionary, Developers, API Reference, navigation, and landing pages for inbound links. Update destination, label, and heading fragment together.
- A retained archive URL is for historical access; active guidance should point to the current replacement.
- Preserve creation dates through physical moves, and advance updated dates only for source changes.
- Keep the current path's last lesson from paginating directly into the archive.
- Run `pnpm --filter developer-guide guide:check`, then the usual date, typecheck, and production-build checks. Inspect generated links and sidebar membership as well as build output.

## Validation sequence

### Maintain page dates

Every Markdown/MDX page in `developer-guide/docs`, `developer-guide/company-developers`, and
`developer-guide/dictionary`, plus Markdown sources rendered from `.agents/skills` and `.codex/skills`, has an
entry in `developer-guide/page-dates.json`. Category metadata (`_category_.json`, `.yml`, or `.yaml`) is tracked
as well, so generated category index pages have dates. Keys are repository-relative source paths, never `.generated` paths.
The initial Created and Updated values were initialized together on 9 September 2026 as the start of date
tracking, rather than reconstructed historical dates. Every document and category footer displays only the Updated
timestamp as `YYYY-MM-DD HH:mm:ss UTC`, using a year-first date and 24-hour time. Keep `createdAt` as internal
registry metadata without displaying it. Keep the display format independent of the viewer's locale and time zone,
and preserve the original instants when changing their presentation.

- Finish all page and rendered skill-source edits, then run `pnpm --filter developer-guide dates:update`.
  The command reads the actual current clock once, preserves each existing `createdAt`, and updates `updatedAt`
  only when the source content hash changes. New pages receive the same current value for both fields.
- Preserve both existing dates when a page is unchanged. Styling, builds, checkout times, and navigation alone
  must not make every page appear newly updated. Do not manually regenerate the registry or reset its baseline.
- When moving or renaming a page, move its existing registry entry to the new repository-relative source key
  before running `dates:update`; this preserves its creation history. The command removes entries for deleted
  pages. Edits to a rendered skill or Markdown reference update its own entry without changing the source's
  frontmatter or copying source content into the guide.
- Run `pnpm --filter developer-guide dates:check` before delivery. It checks complete coverage, content hashes,
  valid UTC ISO timestamps, and `updatedAt >= createdAt`. Standard guide start/build commands run the same
  read-only check and fail on stale metadata; builds never advance timestamps automatically.

### Run validation

Keep the Docusaurus development server stopped for this sequence.

1. Review changed pages alongside the implementation diff.
2. Verify every code block and import against source and package entry points.
3. Verify navigation, category placement, titles, and related links.
4. Search for stale symbols and paths across all three guide surfaces.
5. Run:

```bash
pnpm --filter developer-guide guide:check
pnpm --filter developer-guide dates:update
pnpm --filter developer-guide dates:check
pnpm --filter developer-guide typecheck
pnpm --filter developer-guide build
```

6. Run focused code tests that substantiate documented behavior when they were not already run for the implementation.
7. Run `graphify update .` after code or architecture-document changes, following repository instructions.
8. Complete the [Docusaurus edit lifecycle](#docusaurus-edit-lifecycle): restart the guide, verify startup and
   successful HTTP responses, and leave it running unless the user requested otherwise.

The Docusaurus build is mandatory because it catches invalid MDX, unresolved imports, duplicate routes, invalid sidebars, and broken links that a prose review misses.

## Final review and report

Report:

- changed behavior and implementation source of truth;
- affected audiences and guide pages;
- public entry points documented;
- navigation changes;
- validation performed;
- guide restart status and local URL;
- any remaining documentation debt or suggested authoring improvement.

Do not treat successful Docusaurus compilation as proof that the content is technically correct. Validate both structure and claims.
