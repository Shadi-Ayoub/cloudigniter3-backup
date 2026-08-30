---
name: cloudigniter-guide-authoring
description: Keep the CloudIgniter Docusaurus developer guide synchronized with implemented behavior across the CloudIgniter Users, CloudIgniter Developers, Dictionary, API Reference, and live Skills sections. Use whenever Codex implements, fixes, refactors, deprecates, or removes a capability, public API, configuration contract, architecture, provider integration, runtime workflow, user-facing behavior, or stable ecosystem term; authors or reorganizes files under developer-guide; reviews documentation impact; or audits guide accuracy and completeness. Treat affected guide updates and validation as part of implementation completion.
---

# CloudIgniter Guide Authoring

Treat documentation as a required product deliverable. Derive claims, imports, signatures, and workflows from the current source, public exports, tests, and configuration.

Use this skill together with `cloudigniter-development` when a change depends on CloudIgniter architecture, package ownership, runtime boundaries, request lifecycle, page rendering, or EmberGuard layering.

## Load the relevant references

Read [workflow-and-validation.md](references/workflow-and-validation.md) completely for every task.

Then read every affected section reference completely:

- Read [cloudigniter-users.md](references/cloudigniter-users.md) for application-developer concepts, setup, configuration, tutorials, operational workflows, troubleshooting, provider usage, and user-facing features under `developer-guide/docs` outside `api-reference`.
- Read [cloudigniter-developers.md](references/cloudigniter-developers.md) for contributor-facing architecture, package internals, extension points, provider implementation, ownership, and maintenance workflows under `developer-guide/company-developers`.
- Read [api-reference.md](references/api-reference.md) for public functions, components, hooks, classes, types, constants, configuration contracts, runtime entry points, deprecations, and removals under `developer-guide/docs/api-reference`.

Load more than one section reference when a change crosses audiences. A new public capability commonly needs a user guide page plus API reference pages; add contributor documentation when its implementation introduces architecture or extension rules.

## Authoring workflow

1. Identify the changed behavior, audience, public surface, and implementation owner.
   The Skills tab is a generated read-only view of `.agents/skills` and `.codex/skills`; do not copy or manually edit those files under `developer-guide`. Update a source skill only when you identify a concrete improvement to that skill, and update guide navigation/staging when that mechanism changes.
2. Trace the current implementation before trusting existing documentation. Inspect canonical exports, package `exports`, types, tests, examples, configuration, and consumers.
3. Search the guide for existing coverage, terminology, stale imports, and related links before creating a page.
4. Select all affected documentation sections using the routing rules in the references.
5. Update existing pages before adding parallel explanations. Create new pages and category metadata only when the current information architecture has no suitable home.
6. Keep conceptual guidance, contributor architecture, and symbol-level reference distinct. Cross-link them instead of copying the same explanation into every section.
7. Validate code examples, import paths, runtime labels, defaults, edge cases, and navigation against source.
8. Run the developer-guide typecheck and production build. Resolve broken links, invalid MDX, sidebar failures, and documentation regressions caused by the change.
9. Review the implementation diff and documentation diff together. Do not report a product-change task as complete until affected guide content is current.

## Dictionary links

Treat every term listed in `developer-guide/dictionary-sidebars.ts` as an identified Dictionary term. Whenever an identified term appears in guide prose, make the displayed term a canonical Markdown link to its definition, for example `[proxy](/dictionary/p#proxy)`. The guide's `remark-dictionary-terms` transform enforces this across CloudIgniter Users, CloudIgniter Developers, and API Reference prose when an author misses an explicit link. These links open the Dictionary Viewer without leaving the current guide page; the same URLs still provide normal navigation when JavaScript is unavailable or the reader is already in the Dictionary tab.

Link identified terms in paragraphs, lists, callouts, and table cells. Do not add links inside headings, code spans, code blocks, Mermaid or other diagrams, existing links, or the term's own Dictionary definition. When adding or renaming a term, update its letter MDX file and `dictionary-sidebars.ts` catalog together so the Dictionary tab, viewer search, alphabet navigation, and authoring target stay synchronized.

## Completion gate

For a capability, behavior, contract, configuration, architecture, provider workflow, or public API change, require all of the following:

- update every affected guide section in the same change;
- update navigation or category metadata when discoverability changes;
- update related repository architecture-skill references when architecture changes;
- run `pnpm --filter developer-guide typecheck`;
- run `pnpm --filter developer-guide build`;
- report which audiences and pages changed.

If a change is genuinely internal and has no documentation impact, inspect the guide anyway and state the concrete reason no page changed. Do not manufacture documentation churn for formatting-only, test-only, generated-file-only, or dependency-maintenance changes that preserve documented behavior.

## Continuous improvement

Notice recurring authoring gaps while working. Suggest focused improvements such as missing templates, inconsistent terminology, weak navigation, stale categories, absent link checks, API inventory automation, or examples that cannot be verified. Implement a contained improvement when it directly strengthens the current documentation change; otherwise include it as a concise follow-up suggestion.
