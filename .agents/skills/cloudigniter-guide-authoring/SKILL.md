---
name: cloudigniter-guide-authoring
description: Keep the CloudIgniter Docusaurus developer guide synchronized with implemented behavior across the CloudIgniter Users, CloudIgniter Developers, user and Developer Dictionaries, API Reference, and live Skills sections. Use whenever Codex implements, fixes, refactors, deprecates, or removes a capability, public API, configuration contract, architecture, provider integration, runtime workflow, user-facing behavior, or stable ecosystem term; authors or reorganizes files under docs; maintains guide styling and navigation; reviews documentation impact; or audits guide accuracy and completeness. Treat affected guide updates and validation as part of implementation completion.
---

# CloudIgniter Guide Authoring

Treat documentation as a required product deliverable. Derive claims, imports, signatures, and workflows from the current source, public exports, tests, and configuration.

## Final-reference context

Write every guide page as the final, self-contained reference for CloudIgniter users
or company developers. Assume readers have no access to the originating prompt or
conversation. State the current product behavior and supported workflows directly;
do not narrate requested changes, respond to a prompt, recount naming discussions,
or include instructions to the author about how to write the page. Keep editorial
and maintenance directions in the authoring skill unless the page explicitly teaches
documentation maintenance as a contributor workflow.

Introduce a product or tool, its name, package, executable, audience, and access model
in its owning chapter. Other workflow pages should link to that introduction and
include only the context needed for their task. Preserve useful technical rationale,
prerequisites, limitations, and setup status as reader-facing facts, without describing
the conversation or implementation task that led to the documentation.

## Guide edit lifecycle

Stop the application's Docusaurus development server **before editing** `docs` or source skills
rendered in its Skills section. Keep it stopped during edits, date updates, cache cleanup, and validation. Once the
update and checks are complete, start the guide again and verify it responds successfully. Follow the
[Docusaurus edit lifecycle](references/workflow-and-validation.md#docusaurus-edit-lifecycle); do not rely on hot reload
or leave the guide stopped after a completed update unless the user explicitly requests that.

Display only the Updated footer timestamp for every guide page, including rendered Skills sources and category pages.
Keep creation timestamps as internal registry metadata. Display the Updated timestamp in UTC as `YYYY-MM-DD HH:mm:ss UTC`
for a worldwide audience, independently of the viewer's locale or time zone. After
finishing page edits, run `pnpm --filter docs dates:update`, then `pnpm --filter docs dates:check`.
The tracked `docs/page-dates.json` registry preserves `createdAt`, changes `updatedAt` only for edited
content, and initializes both fields for new pages. Never reset creation dates or derive dates from build time,
filesystem modification times, or Git history. Follow the page-date rules in
[workflow-and-validation.md](references/workflow-and-validation.md), including preservation during renames.

Use this skill together with `cloudigniter-development` when a change depends on CloudIgniter architecture, package ownership, runtime boundaries, request lifecycle, page rendering, or EmberGuard layering.

## Load the relevant references

Read [workflow-and-validation.md](references/workflow-and-validation.md) completely for every task.

Then read every affected section reference completely:

- Read [cloudigniter-users.md](references/cloudigniter-users.md) for application-developer concepts, setup, configuration, tutorials, operational workflows, troubleshooting, provider usage, and user-facing features under `docs/docs` outside `api-reference`.
- Read [cloudigniter-developers.md](references/cloudigniter-developers.md) for contributor-facing architecture, package internals, extension points, provider implementation, ownership, and maintenance workflows under `docs/company-developers`.
- Read [api-reference.md](references/api-reference.md) for public functions, components, hooks, classes, types, constants, configuration contracts, runtime entry points, deprecations, and removals under `docs/docs/api-reference`.
- Read [guide-presentation.md](references/guide-presentation.md) when changing the guide's theme, typography, layout, navigation, homepage, or custom MDX presentation. Use `ui-ux-pro-max` alongside this skill for visual design work.

Load more than one section reference when a change crosses audiences. A new public capability commonly needs a user guide page plus API reference pages; add contributor documentation when its implementation introduces architecture or extension rules.

## Authoring workflow

1. Identify the changed behavior, audience, public surface, and implementation owner.
   The Skills section, reached through **Resources → Skills**, is a generated read-only view of `.agents/skills` and `.codex/skills`; do not copy or manually edit those files under `docs`. Update a source skill only when you identify a concrete improvement to that skill, and update guide navigation/staging when that mechanism changes.
2. Trace the current implementation before trusting existing documentation. Inspect canonical exports, package `exports`, types, tests, examples, configuration, and consumers.
3. Search the guide for existing coverage, terminology, stale imports, and related links before creating a page.
4. Select all affected documentation sections using the routing rules in the references.
5. Confirm Docusaurus is stopped before editing. Update existing pages before adding parallel explanations. Create new pages and category metadata only when the current information architecture has no suitable home.
6. Keep conceptual guidance, contributor architecture, and symbol-level reference distinct. Cross-link them instead of copying the same explanation into every section.
7. Validate code examples, import paths, runtime labels, defaults, edge cases, and navigation against source.
8. Run the docs typecheck and production build. Resolve broken links, invalid MDX, sidebar failures, and documentation regressions caused by the change.
9. Review the implementation diff and documentation diff together. Do not report a product-change task as complete until affected guide content is current.
10. Restart the guide after the edits and checks finish, verify the affected page responds, and report its URL. Stop it again first if further edits are needed.

## Learning path and retired pages

Maintain the explicit Users learning sequence in `docs/user-guide-structure.json`. Keep the API Reference
out of the Users sidebar. Put superseded pages and starter tutorials only under **Obsulete**, with a historical
notice and current replacement link. When removing, renaming, or retiring a page, update inbound links and anchors
across Users, Dictionary, Developers, and API Reference in the same change. Preserve page dates and existing URLs
where practical. Follow the navigation rules in [workflow-and-validation.md](references/workflow-and-validation.md).

## Dictionary links

Treat every term listed in `docs/dictionary-terms.ts` as an identified Dictionary term. Whenever an identified term appears in guide prose, make the displayed term a canonical Markdown link to its definition, for example `[proxy](/dictionary/p#proxy)`. The guide's `remark-dictionary-terms` transform enforces this across CloudIgniter Users, CloudIgniter Developers, and API Reference prose when an author misses an explicit link. These links open the Dictionary Viewer without leaving the current guide page; the same URLs still provide normal navigation when JavaScript is unavailable or the reader is already in the Dictionary tab.

Link identified terms in paragraphs, lists, callouts, and table cells. Do not add links inside headings, code spans, code blocks, Mermaid or other diagrams, existing links, or the term's own Dictionary definition. When adding or renaming a term, update its letter MDX file and `dictionary-terms.ts` catalog together so the Dictionary tab, viewer search, alphabet navigation, and authoring target stay synchronized.

Link a complete multiword term, such as **CloudIgniter User** or **CloudIgniter
Developer**, rather than its `CloudIgniter` prefix. Catalog tuples can include a
third item of aliases for plurals or alternate names; aliases share the canonical
definition, viewer result and stable anchor. Prefer the longest recognized phrase,
including across source line breaks. Preserve anchors when changing display names,
and verify singular/plural linking plus viewer search when adding aliases.

The green Developer Dictionary uses `docs/developer-dictionary` and
`developer-dictionary-terms.ts` for contributor-only terminology. Add internal
terms there instead of the blue user catalog. Developer guides and dev command
manuals auto-link both catalogs; public guides auto-link only user terms. Both
**CloudIgniter User** and **CloudIgniter Developer** profile definitions belong in
the Developer Dictionary, including their plural aliases. Keep them out of the
user catalog even though one profile is named User. Both
viewers share one dialog and render their own MDX definitions. Keep new letter
imports in `src/components/DictionaryViewer/dictionaries.ts` synchronized. Run
`pnpm --filter docs test:dictionary` when changing catalogs or linking.
The current maintainer preview includes both; audience markers are not access
control. Public/developer build and delivery separation is a later phase.

## Command references

Keep executable syntax, option/default tables, invocation examples, exit codes and
command-specific recovery in `docs/commands`. Link to those manuals
from workflow and architecture pages instead of maintaining a second command
catalog. A short invocation may establish a working directory or workflow step;
it must not grow into a duplicate reference.

Begin Developer tooling with the two profiles: CloudIgniter Users use `ci` for
application operations; CloudIgniter Developers use `dev` for company maintenance.
Keep their guidance in separate `tooling/ci` and `tooling/dev` sections. Split setup,
workflows, configuration and implementation into focused pages when they serve
different reading tasks. Introduce the CloudIgniter Developer Toolkit in its
tooling overview, and link to it from publication guidance.

Use the full `ci …` or `dev …` command name when mentioning an executable command.
The guide's `remark-command-references` transform reads the command manuals in
`docs/commands` and links mentions in prose, inline code, headings, and
tables across all docs sections, including rendered Skills. It adds reference links
below shell examples without changing their executable text. Existing links,
diagram source, and mentions on the command's own manual are preserved. Run this
transform before Dictionary linking so command names retain one manual destination.
When adding or renaming a command, update its manual and catalog, then run
`pnpm --filter docs guide:check` and `pnpm --filter docs test:command-references`.

## Guide presentation

Preserve the guide's Changesets-inspired presentation: locally hosted Inter body text, Averia Serif Libre headings,
a readable content width, restrained blue accents, and equivalent light/dark styling. Ordinary Markdown/MDX pages
inherit this theme; avoid page-specific font, color, or layout overrides. Follow
[guide-presentation.md](references/guide-presentation.md) for implementation ownership, current defaults, and
visual verification when presentation changes. This guide theme belongs to `docs`, not the application UI packages.

## Completion gate

For a capability, behavior, contract, configuration, architecture, provider workflow, or public API change, require all of the following:

- update every affected guide section in the same change;
- update navigation or category metadata when discoverability changes;
- review changed prose for final-reference context and place introductions in the owning chapter;
- update related repository architecture-skill references when architecture changes;
- refresh and validate page-date metadata after all documentation and rendered skill-source edits;
- run `pnpm --filter docs typecheck`;
- run `pnpm --filter docs build`;
- for presentation changes, complete the affected desktop/mobile, light/dark, and interaction checks in [guide-presentation.md](references/guide-presentation.md#visual-verification);
- restart the Docusaurus guide after validation and verify it responds, unless the user explicitly asks to leave it stopped;
- report which audiences and pages changed.

If a change is genuinely internal and has no documentation impact, inspect the guide anyway and state the concrete reason no page changed. Do not manufacture documentation churn for formatting-only, test-only, generated-file-only, or dependency-maintenance changes that preserve documented behavior.

## Continuous improvement

Notice recurring authoring gaps while working. Suggest focused improvements such as missing templates, inconsistent terminology, weak navigation, stale categories, absent link checks, API inventory automation, or examples that cannot be verified. Implement a contained improvement when it directly strengthens the current documentation change; otherwise include it as a concise follow-up suggestion.
