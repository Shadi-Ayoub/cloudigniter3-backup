# Graphify setup and operating workflow

## Verified baseline and limitation

The earlier CloudIgniter AGENTS/skill/reference pattern was retrieved. The exact existing
CloudIgniter Graphify configuration, installed version, and local hooks were not available.
Do not call this an exact clone of unseen settings. The setup script reuses an available
CLI without upgrading it, looks for an inherited project/user skill, and installs a
project-scoped Codex skill only when needed and supported.

Primary command reference: official `Graphify-Labs/graphify` README, checked 2026-09-30.
The package name is `graphifyy` (two y's); its command is `graphify`. Treat the installed
version's `--help` and skill as authoritative for command compatibility.

## Initialize locally

From the JODARIS root:

```bash
bash scripts/setup-graphify.sh --install-tool
```

The script preserves an existing CLI version. Only if no CLI is found, `--install-tool`
allows installation using an already available uv or pipx. It does not install a package
manager, use sudo, create an account, purchase a service, set model keys, or change global
Codex settings. Tool installation requires network access. Without that flag, a missing
CLI is reported rather than installed.

A required new project skill uses the verified command:

```bash
graphify install --project --platform codex
```

Older CLI versions without `--project` are reported instead of silently installing a
global skill or upgrading the parent's toolchain. Existing skills in supported local or reachable ancestor/user .agents/skills locations
are reused where detectable. Legacy .codex/skills locations are reported for review
rather than silently copied or considered active. Open Codex from the JODARIS root so
its project instructions and local skill are in scope. Inspect disabled skill settings
locally if a present skill is not appearing; presence alone does not prove activation.

## Build the first graph in Codex

Use the installed skill in a Codex task rooted at this project:

```text
$graphify .
```

Tell the agent to include `index.html`, the JODARIS skill/reference files, project decisions,
and the design screenshot, while obeying `.graphifyignore`. Use the existing assistant
session for the semantic pass; do not automatically configure another model provider.

Expected products in `graphify-out/`: `graph.json`, `GRAPH_REPORT.md`, and `graph.html`.
Check the real files and their source paths. **This package does not contain a generated
graph and the installer does not claim to generate one.** A graph of code alone is not a
semantic index of design/content references or images.

Codex's skill uses `$graphify`; do not paste it as a shell command. In other supported
assistants the invocation can differ. The installed skill is the final authority.

## Query before broad exploration

Run from the JODARIS root and name its graph explicitly:

```bash
graphify query "Where are JODARIS contact details and the email draft behavior defined?" --graph graphify-out/graph.json
graphify query "Which references define the design tokens and future CloudIgniter migration?" --graph graphify-out/graph.json
```

Read the affected source before changes. Inferred links are not verified dependencies.
Use `GRAPH_REPORT.md` for broad architecture orientation, not as mandatory bulk context
for every small edit. A stale/empty/missing graph must not block direct source inspection.
Do not fall back silently to the parent CloudIgniter graph for JODARIS-specific questions.

## Refresh and inspect

After structural code changes, use the installed CLI's supported update workflow
(current reference: `graphify update .`). For copy/reference/diagram changes, use the
skill's semantic update workflow (current Codex form: `$graphify . --update`). Confirm
that docs/media were actually processed and run a representative query afterward.
A version without a flag may require the skill to choose its compatible alternative.

Record CLI version, graph source root, refresh command, files produced, and validation
in `docs/graphify-setup-status.txt` or a task report. Generated paths/caches are machine-local.
Never ship a Linux/sandbox interpreter path as the user's macOS configuration.

## Parent repository and hook safety

JODARIS may be inside the existing CloudIgniter Git repository. The scripts deliberately
do not run `graphify hook install`, create `.git`, or rewrite parent hooks/configuration.
That command can affect the enclosing repository; inspect its actual hooks/root and
make a separate decision before changing anything there. The JODARIS `AGENTS.md` already
contains persistent graph-first guidance. Do not duplicate hooks for the same workflow.

## Privacy and generated outputs

`.graphifyignore` excludes credentials, environment files, dependencies, build output,
installation-review files, and Graphify output/tool instructions. It intentionally leaves
the JODARIS design/content references eligible. Inspect discovered inputs before a
semantic pass. Code parsing and model-based document/image interpretation are different;
do not claim all semantic processing stays on-device. Do not add private client material,
student data, cloud secrets, or unrelated parent files to the graph.

The graph is locally generated and ignored by Git in this initial setup. Sharing queryable
outputs later is a separate choice. Do not deploy the graph, agent instructions, references,
setup reports, source maps, or credentials as public website files.
