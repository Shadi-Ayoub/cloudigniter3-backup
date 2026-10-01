# JODARIS project instructions

Applies to this `jodaris/` subtree. Read this file before changing the site.
Use `.agents/skills/jodaris-development/SKILL.md` for implementation and review.
Read relevant parent CloudIgniter instructions as well; do not replace or rewrite them.

## Scope and present state

JODARIS is the company website for Digital Applications, Research, Innovation,
and Systems. `index.html` is the current, self-contained static implementation.
`jodaris-desktop-hero.png` is a visual reference, not a runtime asset.
The company website is distinct from the technical CloudIgniter product website.

**Future direction, recorded 2026-09-30:** JODARIS will migrate to the CloudIgniter
template, using Next.js and AWS cloud services. This replaces the earlier intention
to keep JODARIS independent of that template. It does not authorize that migration
now, or the creation of AWS resources, deployments, DNS changes, or subscriptions.

## Read before implementing

- Visual changes: skill `references/design.md` and `design-tokens.json`, then the screenshot and current CSS.
- Copy changes: `references/content.md` and `content-inventory.json`, then current rendered and dialog copy.
- JavaScript or accessibility: `references/interactions.md` and `quality-checks.md`.
- Structure or platform changes: `references/architecture.md` and actual parent CloudIgniter rules/exports.
- Repository exploration: `references/graphify.md`; query the correct project graph before broad searches when a current graph is available.

The JSON files are documentation snapshots, not live content/configuration sources.
Keep them synchronized when their corresponding design or copy changes. Record any
intentional baseline change in `docs/decisions.md`.

## Current implementation rules

1. Keep the static page deployable as a single `index.html` until migration is requested.
2. Preserve the existing visual language, four disciplines, clear typography, and purposeful motion.
3. Do not invent clients, partners, awards, certifications, case studies, statistics,
   office addresses, response-time commitments, or claims of existing AWS integrations.
4. The initial contact address is `shadi@jodaris.com`. Preserve visible text, mailto
   links, the body data attribute, fallback copy, and dialog behavior consistently.
5. The conversation form prepares a draft for the visitor's email application.
   Do not claim it sent or stored a message. Do not add a backend or telemetry silently.
6. Preserve keyboard navigation, focus visibility, dialog dismissal, pause controls,
   reduced-motion behavior, readable no-JavaScript content, and mobile layouts.
7. No secrets, credentials, private datasets, or private configuration in browser code.
8. Avoid new libraries, fonts, build tools, or network dependencies for minor changes.
9. Do not upload this entire development directory into a public website root.
   Stage the current public release with `bash scripts/prepare-static-deploy.sh`;
   deploy only the contents of `dist/`.

## CloudIgniter ownership during the future migration

Inspect the actual parent repository before relying on historical paths.
JODARIS copy, branding, and page composition remain application-specific.
Reusable platform behavior belongs in its established owning package:
`core` for generic public contracts/APIs; `emberguard` for internal generic security
capabilities; `next` for Next.js integration and provider binding; `aws` for AWS
implementations; `ui` for reusable UI primitives. Do not copy those implementations
into JODARIS. Use real public exports, never guessed symbols or deep `src` imports.
Keep public types under the owning package's `src/types/<domain>/` with its canonical
`/types` exports, and maintain client/server boundaries.

## Graphify policy

Consult `graphify-out/graph.json` only when it exists and describes this project.
Use an explicit graph path in queries to avoid accidentally querying the parent
CloudIgniter graph. Treat extracted relationships as navigation aids and inferred
relationships as hypotheses; verify the source before editing.

For a missing graph, inspect source directly and state that graph generation is
pending. After meaningful source changes, refresh the structural graph; after
copy/reference changes, refresh the semantic graph through the installed skill.
Do not claim Graphify was run without actual command/output evidence. Use the
installed Graphify skill for exact version-compatible build steps. Never fabricate
`graph.json`, a success report, or a machine-local Python path.

Keep the existing CloudIgniter Graphify version and skill when usable. Do not
install repository-wide Git hooks, change global agent settings, or add duplicate
skills just to initialize this nested site. Do not read secrets into the graph.
Do not automatically send docs/images to a new model provider or create API keys.

## Work safely and report accurately

Inspect Git status first. This directory may be part of the parent CloudIgniter
repository; do not run `git init`, commit, push, stage unrelated changes, or change
workspaces/lockfiles without a reason within the requested task. Preserve user edits.

Run `node scripts/check.mjs` for static integrity and JavaScript syntax checks.
Run the browser checks in `quality-checks.md` for changes to presentation/behavior.
A static check is not a browser test or an accessibility audit. During migration,
use the actual repository's lint/typecheck/test/build scripts.

Report changed files, behavior changes, tests actually executed, graph status,
and anything not verified. Do not describe planned features as implemented.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
