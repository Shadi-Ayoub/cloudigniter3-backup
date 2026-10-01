---
name: jodaris-development
description: Build, refine, debug, and review the JODARIS company website, including its design, content, interactions, accessibility, Graphify workflow, and future migration to the CloudIgniter Next.js/AWS template. Use for work in the jodaris project; not for unrelated CloudIgniter platform work.
---

# JODARIS website development

## Start here

Read the JODARIS `AGENTS.md` and applicable parent instructions. Establish the current
phase before editing: the initial site is standalone HTML; the CloudIgniter/Next.js/AWS
migration is a future approved direction, not already implemented.

Keep the company site distinct from the CloudIgniter technical product site.
Do not infer company achievements from the founder's unrelated institutional work.

## Portable path convention

Use the JODARIS project root as `.` for ordinary project paths and command examples.
This is the directory containing the JODARIS `AGENTS.md` and this skill's
`.agents/skills/jodaris-development/` tree, not necessarily the enclosing Git root.
Run project commands from there. Do not hardcode a drive, home directory, or checkout
location. Resolve a tool's required absolute paths at runtime, without saving them
in portable instructions or configuration.

Markdown links remain relative to the file containing the link; this skill's references
therefore use `references/...`. CloudIgniter package/template paths are explicitly
relative to the actual CloudIgniter repository root. See
[architecture.md](references/architecture.md) for the root definitions and examples.

## Reference routing

Load only what the task needs:

| Task | References |
| --- | --- |
| Color, layout, typography, graphics, responsive design | [design.md](references/design.md), [design-tokens.json](references/design-tokens.json) |
| Positioning, copy, services, calls to action, metadata | [content.md](references/content.md), [content-inventory.json](references/content-inventory.json) |
| Animation, forms, navigation, dialogs, tabs | [interactions.md](references/interactions.md) |
| Architecture, package ownership, future migration | [architecture.md](references/architecture.md) |
| Graph setup, discovery, refresh, privacy | [graphify.md](references/graphify.md) |
| Verification and release | [quality-checks.md](references/quality-checks.md) |
| Evidence and provenance | [sources.md](references/sources.md) |

## Workflow

### 1. Establish the change and context

Read the actual target files. Inspect Git status and detect whether `jodaris/` is a
subdirectory of the CloudIgniter repository. Preserve pending work and do not create
a nested repository. Classify the request as content, visual, behavioral, structural,
or migration work. Keep the implementation within that scope.

### 2. Inspect with the graph where useful

Follow `references/graphify.md`. Query a current local graph with an explicit path
before broad repository searches. Inspect the source nodes implicated by that query.
A graph cannot substitute for inspecting the current code, CSS, copy, or rendered page.
When no graph exists, use a focused source inspection and state the limitation.

### 3. Identify ownership

For the static phase, edit `index.html` and the matching references only as necessary.
Do not introduce React/Next.js, split runtime files, or add AWS services as an incidental
cleanup. For a requested migration, inspect the real CloudIgniter template and APIs first.
Place JODARIS-specific content and composition in the app; evaluate reusable work for its
proper platform package. Reuse rather than recreate established capabilities.

### 4. Implement the smallest complete change

Preserve the brand palette, deliberate type hierarchy, generous spacing, four-discipline
positioning, useful interactions, and honest contact behavior. Avoid new dependencies
for effects already achievable with native browser APIs. Match the current selectors,
ARIA relationships, and JavaScript constants when making markup changes.

If text or tokens change, update their reference snapshots in the same change.
Preserve the original screenshot unless deliberately establishing a new visual baseline;
record the reason and validation for any replacement.

### 5. Verify

Run `node scripts/check.mjs`. For visual/interactive changes, serve the public staging
folder locally and test desktop, tablet, mobile, keyboard operation, reduced motion,
no-JavaScript fallbacks, and dialog/form flows. Confirm no console errors or horizontal
overflow. Use `references/quality-checks.md`; do not label unexecuted checks as passed.

During migration, run the actual project's relevant typecheck, lint, tests, production
build, and bundle/runtime-boundary checks. Do not invent command names.

### 6. Refresh context

Refresh Graphify after significant source or documentation changes with the installed
skill's supported workflow. Check queryable outputs and representative source links.
Update `docs/decisions.md` for architectural decisions and changed brand/content baselines.

### 7. Close the task

Summarize the change, ownership, validation performed, Graphify status, and unresolved
constraints. State explicitly when there was no deployment, no AWS provisioning, or
no browser test. Keep planned capabilities separate from working behavior.

## Completion standard

The requested behavior works, the design/content references remain consistent, the
single-file release remains usable until the authorized migration, no unrelated parent
files or services were changed, and verification claims match actual evidence.
