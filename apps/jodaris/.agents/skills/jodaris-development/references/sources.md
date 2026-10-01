# Sources and provenance

Prepared: 2026-09-30.

## User-owned evidence

- Current request: target macOS directory, same CloudIgniter skill/Graphify pattern,
  initial design/content references, future CloudIgniter-template + Next.js + AWS direction.
- Supplied `index.html`: exact source for current page content, tokens, behavior, and metadata.
- Supplied `jodaris-desktop-hero.png`: original desktop visual reference, not a full-site audit.
- Retrieved CloudIgniter `AGENTS.md`, `SKILL.md` (`cloudigniter-development`), and
  `architecture.md`: prior package ownership, EmberGuard layering, public API/type
  organization, runtime boundaries, and template composition rules. Historical copies
  informed this package; live local versions must be inspected before platform edits.
- Prior project context: company site/product-site distinction and domain/email arrangement.
  Current local/provider configuration was not inspected.

## Official tool references

Graphify source/installation, project scope, ignores, graph outputs, and Codex invocation:
https://github.com/Graphify-Labs/graphify

Graphify CLI query/update overview (compare against installed help):
https://graphiffy.com/docs/install
https://www.graphiffy.com/integrations/codex

Codex skills, local discovery, SKILL.md metadata, and optional openai.yaml:
https://developers.openai.com/codex/skills

Codex project instructions:
https://developers.openai.com/codex/guides/agents-md

These references were checked while preparing this package. Tool versions and docs may
change; no version was inferred for the user's Mac and no local installed tool was upgraded.

## Scope of verification

The Mac volume and live CloudIgniter repository were not accessible during preparation.
No files were moved directly to that Mac, no production site was modified, no AWS
resources were created, and no graph was generated against the user's actual repository.
See `docs/package-validation.md` for tests executed on the packaged scripts/assets.
