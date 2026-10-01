# Architecture and future migration

## Decision and current state

On 2026-09-30, the owner specified that JODARIS will later use the **CloudIgniter template,
Next.js, and AWS cloud services**. This supersedes the earlier decision to keep the
company website separate from the CloudIgniter implementation. Product positioning
remains separate: JODARIS is the company; CloudIgniter is its technical platform/product.

The current deliverable is still a standalone `index.html`. There is no Next.js app,
AWS environment, cloud backend, database, authentication, deployed contact endpoint,
package manifest, or workspace/lockfile change in this setup.

## Project location and portable paths

**JODARIS project root: `.`**

In these instructions, `.` means the directory containing the JODARIS `AGENTS.md`
and `.agents/skills/jodaris-development/`. The current `index.html` also lives there.
The project root is not tied to a drive, username, checkout name, or fixed location
inside another repository. Do not assume it is the enclosing Git repository root.

### Path conventions

- Ordinary project paths and shell command examples are relative to the JODARIS
  project root. Run those commands from that directory unless stated otherwise.
- Markdown link targets are relative to the Markdown file containing the link.
  A project's root-relative path in prose is not automatically a valid link target.
- CloudIgniter package/template paths in the ownership table and migration sections
  are relative to the actual **CloudIgniter repository root**, not the JODARIS root.
  Inspect the containing workspace to locate that root. For a separate checkout,
  obtain its location from the current task or local configuration; do not guess it.
- Do not store machine-specific absolute paths in skill files, references, or portable
  project configuration. Derive any absolute path required by a tool at runtime.
- Moving the JODARIS folder does not change its internal relative paths. Recheck
  external workspace references and regenerate machine-local graph/cache data when
  necessary; do not embed the new checkout location into these instructions.

| Resource | Path relative to the JODARIS project root |
| --- | --- |
| Project instructions | `./AGENTS.md` |
| Development skill | `./.agents/skills/jodaris-development/SKILL.md` |
| Skill references | `./.agents/skills/jodaris-development/references/` |
| Static entry point | `./index.html` |
| Validation script | `./scripts/check.mjs` |
| JODARIS graph, when generated | `./graphify-out/graph.json` |

For a literal file-relative path from this reference directory to the JODARIS root,
use `../../../..`. For example, the link to [project instructions](../../../../AGENTS.md)
is relative to this `architecture.md` file. From `SKILL.md`, reference links instead
use `references/design.md`, `references/content.md`, and similar local paths.

A standalone checkout or a nested location such as `apps/jodaris/` can use these same
instructions. The nested example is relative to a containing repository, not a required
location or a declaration that the project has already moved. Inspect its live versions,
exports, workspace layout, skill revisions, hooks, and AWS configuration locally.
Historical instructions are guidance, not proof of the current tree. Do not relocate
the project, modify workspace membership, or add a nested Git repository without an
explicit structural decision after inspecting the workspace.

## Ownership rules carried forward

| Layer | Responsibility |
| --- | --- |
| JODARIS app | Company copy, brand tokens, assets, pages, composition, app-specific configuration |
| `packages/core` | Generic public platform APIs and contracts; public provider-agnostic EmberGuard facade/types |
| `packages/emberguard` | Internal framework/provider-agnostic security capability implementation |
| `packages/next` | Next.js-specific integration, request/runtime orchestration, selected-provider binding |
| `packages/aws` | AWS-specific provider implementations and adapters |
| `packages/ui` | Reusable UI primitives and shared presentation behavior |
| Actual CloudIgniter template | Starting composition/configuration pattern to inspect and reuse |

Verify actual package names and dependencies before editing. Use supported public
entry points; never invent exports or deep-import internal source. Maintain runtime
separation. Public types follow the owning package's canonical `/types` contract and
`src/types/<domain>/` organization. Generic packages must not depend on JODARIS.

## Migration sequence — future work, not executed

### 1. Inspect and agree the integration surface

Read actual parent `AGENTS.md`, the CloudIgniter development skill and references,
package/workspace manifests, template composition, public exports, provider setup,
routing/i18n/theme conventions, and validation scripts. Establish a baseline commit or
recoverable snapshot without disturbing unrelated work. Query the relevant graph.

### 2. Start from the existing template

Use the actual CloudIgniter template, not a parallel generic Next.js starter. Confirm
application location, workspace membership, package versions, public imports, and build
commands from the repository. No guessed scaffolding commands or default AWS resources.

### 3. Move presentation with visual parity

Move metadata/layout/sections into template-compatible components. Convert CSS variables
to the established theming mechanism while retaining the initial look. Keep business
copy in a typed application-owned content module when appropriate. Treat reference JSON
as a starting inventory, not a predesigned runtime CMS schema.

Candidate components: SiteHeader, HeroSection, ConnectedCore, ExpertiseGrid,
CapabilityDialog, AboutSection, ApproachTabs, ContactSection, ConversationDialog,
and SiteFooter. Names are proposals, not existing APIs. Keep client-side interactivity
isolated and clean up observers/listeners/animation loops.

### 4. Integrate AWS only for an approved requirement

Use existing CloudIgniter provider/service abstractions. Authentication, persistence,
a contact endpoint, file storage, analytics, and transactional email are possibilities,
not requirements of a public company landing page. Do not provision them speculatively.
Record data handling, cost/ownership, permissions, secrets, error behavior, and operational
responsibility before activating a real service. Browser bundles must never contain
server credentials or server-only SDK code.

### 5. Verify before cutover

Run actual repository checks plus browser parity, keyboard/reduced-motion tests,
production build review, runtime separation, routing/metadata checks, and any enabled
integration tests. Preview before production changes. Retain the static release for
rollback. Do not delete `index.html` or replace DNS during the initial port.

Domain/email arrangements must be inspected before deployment: the owner's earlier
plan kept registration/email with Bluehost and hosting on AWS. Hosting migration does
not authorize changing MX/TXT records or email delivery. No DNS action is performed here.

## Exit criteria

A template-based site reproduces the intended JODARIS design and content; runtime
boundaries and public APIs are correct; only approved AWS services are active; forms
accurately describe real delivery behavior; tests and Graphify are refreshed; and the
owner has a reviewed release/rollback path. Until those checks are done, mark migration
items pending in `docs/decisions.md` rather than claiming platform integration is complete.
