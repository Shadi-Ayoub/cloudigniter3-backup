# JODARIS

Company website for **Digital Applications, Research, Innovation, and Systems**.

Current phase: self-contained static landing page. Future direction: migrate to the
existing CloudIgniter template and use Next.js/AWS services as required. The migration
has not started in this package.

## Project files

- `index.html` — complete static site; embedded CSS, JavaScript, and graphics.
- `jodaris-desktop-hero.png` — supplied desktop design reference; not loaded by the site.
- `AGENTS.md` — persistent project instructions.
- `.agents/skills/jodaris-development/` — development skill with focused reference files.
- `.graphifyignore` — graph scope/privacy exclusions.
- `scripts/` — setup, static checks, release staging, and local preview.
- `docs/` — decisions, original hashes, setup status, and package verification.

## AI development

Open Codex at this project root. The skill name is `jodaris-development`; invoke it as:

```text
$jodaris-development
```

Read `AGENTS.md` and applicable parent CloudIgniter rules before edits. The skill routes
tasks to design, content, interactions, architecture, Graphify, and quality references.
The reference JSON is a documentation snapshot; the static page does not load it.

## Graphify

```bash
bash scripts/setup-graphify.sh --install-tool
```

This reuses the installed CLI and an available local/inherited skill when possible.
If a new CLI is needed, it uses an already-installed uv or pipx and the official
`graphifyy` package. It never upgrades an existing Graphify installation automatically.
No parent Git hooks or global Codex settings are modified.

Then generate the graph inside a Codex task rooted here:

```text
$graphify .
```

The initial graph is intentionally not fabricated or shipped. See the skill's
`references/graphify.md` for scope, privacy, queries, refresh, and older-version handling.

## Check, preview, release

```bash
node scripts/check.mjs                  # Node 18+; no npm install
node scripts/check.mjs --baseline       # additionally check original two asset hashes
bash scripts/preview.sh                 # Python 3; http://127.0.0.1:4173
bash scripts/prepare-static-deploy.sh    # stages dist/index.html only
```

Stop preview with Ctrl+C. To change the port: `PORT=4174 bash scripts/preview.sh`.
Upload **only the contents of `dist/`** to the current website root. Do not deploy this
whole directory, the screenshot, agent instructions, setup scripts, reference files,
or any `graphify-out/` data.

The contact address is `shadi@jodaris.com`. The form prepares a visitor-reviewed email
draft; it does not send to a backend or store an enquiry.

## Future CloudIgniter migration

Read `references/architecture.md` under the JODARIS skill and `docs/decisions.md`.
Inspect the real template, manifests, public exports, and provider setup before choosing
paths or dependencies. Preserve application/platform ownership and client/server separation.
No Next.js scaffolding, AWS resources, DNS changes, or parent workspace edits are included.
