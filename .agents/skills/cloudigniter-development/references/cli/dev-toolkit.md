# DEV company toolkit

Use this reference for `packages/dev`, the `dev` executable, release policy,
release requests, and future company developer workflows. Apply the shared
[CLI conventions](./development.md) and [release gates](../authoring/testing-and-release.md).

## Contents

1. Purpose and current scope
2. Source map
3. Release-request invariants
4. Extending the toolkit
5. Keep the skill and guide current
6. Validation

Shared package workflows and `ci-dev.config.json` are documented before the
release-request invariants below.

## Purpose and current scope

`@cloudigniter/dev` is the restricted company toolkit. It owns the `dev` executable
and package build exports under `/tooling/tsup`, `/tooling/entries`, and
`/tooling/inject-use-client`, with build types under `/types`. Release-request
internals remain private. Consumers declare DEV as a development dependency.

Keep application/system operations in public `ci`. All former `ci-dev` dispatch,
workspace guards, maintainer workers and build exports have moved to DEV; the old
executable and build export paths are removed. Keep package-local configuration
and quality gates in their owning packages. Share application module validation
and package loading through the CLI's explicit APIs; never invert that dependency.

The implementation provides:

| Command | Contract |
| --- | --- |
| `dev start docs/template/website jodaris/website cloudigniter` | Foreground workspace website startup, readiness-bound browser opening and existing-build previews. |
| `dev open terminal [target]`                                   | New VS Code integrated terminal at a registered package/app/Docs root or invoking directory; `--external` opens a system terminal window.                                  |
| `dev publisher` | Local loopback GUI for discovered targets, build/check actions, reviewed release requests, profile selection, linked configuration editing and build inspection. |
| `dev package ...` | Build, test, typecheck, check, quality, artifact/release validation, watch, cleanup, switching and assets from the invoking package. |
| `dev quality ...` | Scan distribution client directives or list source client files. |
| `dev next ...` | Generate the combined theme or test a stylesheet. |
| `dev modules ...` | Validate core/user modules and synchronize dependencies; `sync --check` is read-only. |
| `dev template export --output=<directory>` | Prepare a standalone public application from explicit policy; `--dry-run` validates without writing. |
| `dev template check --output=<directory>` | Compare a pristine export against current source and policy without modifying it. |
| `dev template publish/status/deliver` | Request private review, inspect it, then deliver approved bytes to the public repository as an owner. |
| `dev github setup [--check]` | Prepare or resolve the GitHub CLI executable without workspace discovery or authentication. |
| `dev github check/profiles/repositories` | Verify a selected account or list non-secret profile/repository settings. |
| `dev github auth/repo/pr/issue/run/workflow` | Browser login and profile checks, configured repository inspection, ordinary workspace/product PRs, issues and Actions status. See publishing for exact review safeguards. |
| `dev github clone/pull/scaffold` | Safely obtain configured checkouts or generate local npm/static-AWS build workflow files. |
| `dev npm plan [intent]` | Offline, read-only Changesets proposal; dirty checkout allowed. |
| `dev npm publish [intent] --dry-run` | The same offline preview. |
| `dev npm publish [intent]` | Create/recover versioned source PRs in affected private package repositories. |
| `dev npm status <number>` | Read open/closed/merged request state; publication remains unverified. |
| `dev npm version/candidate/deliver` | Apply approved versions, build exact archives and request review in matching private build repositories. |
| `dev npm stage` | Legacy monorepo staging; paired releases use the generated build-repository workflow. |

Source version `0.1.0` does not imply registry publication. Paired repositories,
`Shadi-Ayoub` requester, `jodaris` approver and both profiles are configured locally.
Remote repositories, protections, npm bootstrap/access and AWS resources still need setup. See [publishing](publishing.md)
for private template requests, owner delivery, reviewed version application, candidate
archives and native npm staging. Final npm approval remains interactive.

## Source map

Paths below are relative to the repository root:

| Path | Responsibility |
| --- | --- |
| `packages/dev/bin/dev.mjs` | Executable entry and top-level error boundary. |
| `packages/dev/bin/setup-github.mjs` | Best-effort package postinstall hook. |
| `packages/dev/src/github-cli.mjs` and `github-cli-release.mjs` | Native GitHub CLI resolution, verified managed installation and reviewed release hashes. |
| `packages/dev/src/cli.mjs` | Strict Meow parsing, help and command dispatch. |
| `packages/dev/src/maintainer-cli.mjs` | Maintainer catalog, per-command flags, prompts and dispatch. |
| `packages/dev/src/workspace-commands.mjs` | Convenience catalog, workspace-only target resolution and launch plans. |
| `packages/dev/src/workspace-runtime.mjs`, `workspace-restart.mjs` and `workspace-static.mjs` | Website lifecycle, verified default-port restart, browser/terminal adapters and confined static previews. |
| `packages/dev/src/maintainer-runtime.mjs` | Private-workspace guard and local worker/process execution. |
| `packages/dev/src/package-config.mjs` | Validate company package cwd and `ci-dev.config.json`. |
| `packages/dev/src/package-workflows.mjs` | Common test runner, command descriptions, tools and ordered recipes. |
| `packages/dev/src/template-export.mjs` | Template policy, confined reads, standalone transformations, export and exact comparison. |
| `packages/dev/src/checks/package-build-gate.test.mjs` | Shipped build-gate regressions; also included in DEV's own suite. |
| `packages/dev/src/workers/` | Migrated build, quality, Next and module-maintenance workers. |
| `packages/dev/src/tooling/` | Package build configuration exports. |
| `packages/dev/src/types/index.d.mts` | Canonical exported build types. |
| `packages/dev/src/policy.mjs` | Workspace discovery and release-policy validation. |
| `packages/dev/src/release-plan.mjs` | Changesets integration, version planning and presentation. |
| `packages/dev/src/github.mjs` | npm request preflight, recovery and status. |
| `packages/dev/src/github-api.mjs` and `github-request.mjs` | Shared GitHub transport, clean-base checks and private request creation. |
| `packages/dev/src/github-profiles.mjs` | Per-command GitHub credentials without global switching. |
| `packages/dev/src/github-workflow.mjs` | Strict everyday GitHub command catalog, browser login and revision-bound PR review/merge. |
| `packages/dev/src/repositories.mjs` and `repository-config.mjs` | Shared validated source/build inventory and safe clone/pull. |
| `packages/dev/src/source-mirror.mjs` and `source-mirror-git.mjs` | Exact merged-PR/check verification and inventory-based private source synchronization. |
| `packages/dev/src/paired-releases.mjs` | Versioned source snapshots and approval/hash verification. |
| `packages/dev/src/build-repositories.mjs` | Immutable archive PRs and workflow scaffolding. |
| `packages/dev/src/ci/` | Standalone npm verifier, marketing AWS workflow and protected Docs artifact/hosting verifier and workflow. |
| `packages/dev/src/github-policy.mjs` | Non-secret repository routing and account allowlists. |
| `packages/dev/src/template-publish.mjs` | Private template requests, independent approval verification and public-only delivery. |
| `packages/dev/src/npm-staging.mjs` | Reviewed versions, verified archives and native npm staging. |
| `packages/dev/src/runtime.mjs` | Shell-free subprocesses and operational errors. |
| `packages/dev/src/types.d.mts` | Private implementation types for checked JavaScript. |
| `packages/dev/__tests__/` | Parser, planning and simulated GitHub regression coverage. |
| `.cloudigniter/release-policy.json` | Company repository, reviewers, packages, registry, access and channels. |
| `.cloudigniter/github-policy.json` | Backup/public template destinations, requesters and template reviewers. |
| `.cloudigniter/template-policy.json` and `.cloudigniter/template/` | Exact public application file inventory, versions, rewrites and standalone overlays. |
| `.cloudigniter/source-mirroring.json` and `.github/workflows/source-mirror.yml` | Post-merge quality bindings, App-backed source synchronization and recovery. |
| `.github/workflows/dev-quality.yml` | Node 22/24 checks and reviewable package archives. |
| `.github/workflows/npm-stage.yml` | Legacy monorepo workflow; paired mode uses generated build-repository workflows. |
| `.cloudigniter/repositories.json` and `github-profiles.json` | Validated project pairs and named non-secret account identities. |

Confirm the source before changing a contract; update this map when ownership
moves. The package uses ESM, strict TypeScript `checkJs`, Meow, Execa and Changesets.
The CLI and HTTP runtime do not depend on Next.js/provider packages or private CLI internals.
Publisher's browser feedback bundle consumes the public UI client entry and React.
Shared validation uses `@cloudigniter/cli/tooling/modules`; module synchronization
uses `@cloudigniter/cli/runtime/package-entry` when resolving installed helpers.
The existing migrated workers retain their previous JavaScript validation scope;
the new parser/runtime and release code retain strict `checkJs`, and build export
TypeScript/declarations are included in the package typecheck.

Maintenance must discover the private `cloudigniter` pnpm workspace and verify
`packages/dev/package.json`. It does not require release policy or GitHub setup.
Keep workers scoped to their original cwd. Preserve TTY build/switch prompts,
`--no-interactive`, shell-free execution, signal behavior and subprocess exit
codes. Reject unrelated flags and extra operands before mutation. Keep the build
quality gate before artifact cleanup; Next's gate also runs DEV's migrated
build-gate regression test file.

## Workspace convenience

`dev start docs`, `dev start template`, `dev start website jodaris` and
`dev start website cloudigniter` belong to private DEV. Default ports are 3010,
3000, 3001 and 3002 respectively; default mode is dev and host is 127.0.0.1.
Resolve from the invoking directory using the existing private-workspace guard.
Every nested directory works. Refuse outside/consumer invocations and
`--workspace-root`, including previews; do not resolve from DEV's installed path
or the developer's home. Help/version remain bootstrap exceptions.

Use explicit repository sourcePath mappings, with conventional docs/apps roots as
fallback. Require target manifests and package scripts; preserve Next preparation
hooks and Docs prestart checks/clear. `--mode=prod` selects existing-build
serve/start, without building. Independent JODARIS and CloudIgniter sites require explicit `--site-root` outside the monorepo for start/terminal commands, with matching website project metadata. Their staticHosting metadata permits source or prepared dist preview; a Next dependency activates the framework adapter. Never derive their checkout path from inventory null source paths or download them implicitly. Workspace Publisher excludes them. Templates are discovered under apps/templates/* with distinct package identities.

Validate port/host and command-specific options before processes. Explicit ports
never fall back silently. Docs/template plans enable restartOnBusy only on their
default ports (3010/3000), including an explicit default. Check IPv4/IPv6 even
when the requested bind address would be free. Verify every listener's framework
CLI and project using process ancestry and the project-local framework
path or cwd. Use ps/lsof on macOS/Linux and PowerShell process inspection on Windows;
refuse an unrelated checkout, unknown listener or failed inspection without signals.
Recheck listener ownership and process birth identity before stopping the verified
CLI/descendants. Wait for shutdown, escalate only those verified surviving processes
after three seconds. After shutdown, poll bind availability for up to five seconds
before launching the requested mode on the same port; log once while waiting.
Persistent occupation fails before launch/browser opening. Do not signal new
listeners during this wait or inherit ownership from the stopped process tree.
Never increment ports. Custom-port and website collisions
retain their errors. Dry-run performs no inspection, stop or launch.
Keep server output streamed in the foreground, open the
browser once connections are accepted, and terminate only the launched process
tree on Ctrl+C/SIGTERM. Preserve child failures; cancellation uses 130. `--no-open`
keeps browser navigation manual. `--dry-run --json` previews without any launch;
JSON requires dry-run. Static previews exclude hidden/config/script paths and
symlinks rather than serving the entire source tree.

`dev open terminal [target]` discovers packages, apps, Docs and explicitly mapped
project roots. Packages require a CloudIgniter manifest; apps/Docs require a named
manifest or labelled Publisher metadata. Infer folder and manifest aliases, use
known project mappings for site names, and accept workspaceName as an explicit
short alias independent of the folder. Recognize qualified registered paths and
project IDs; reject empty/unregistered folders, ambiguous matches, traversal and
symlinks. Never select the first of several matches. Omitted selection preserves
the invoking directory. Default mode opens a new VS Code integrated terminal with
window.createTerminal({cwd,name}), uses the configured VS Code terminal profile,
confirms a shell PID and returns; never occupy or change the caller's terminal.
`--external` selects macOS Terminal, Windows Terminal or Linux x-terminal-emulator.
Keep shell navigation strictly quoted and user paths out of executable script
source. The previous --in-place option is removed; no TTY is required for the
integrated transport. Require a trusted local desktop VS Code workspace; otherwise
report --external rather than silently falling back.

workspace-vscode.mjs packages the exact bundled src/vscode-terminal extension as
an offline VSIX and installs it through the code CLI on first use. The extension
activates on startup and owns a bearer-authenticated loopback bridge. Store its
0600 endpoint receipt only under ignored .cloudigniter/local; retain stale receipts,
never include credentials in logs, and refuse symlinks and out-of-workspace paths.
Create only terminals, never send arbitrary commands/text or invoke a shell from
a request. Confirm shell startup before success and dispose a failed new terminal.
Do not claim success after an inactive-helper timeout; guide the developer to Trust,
Enable and Reload Window. New terminals inherit the invoking-window endpoint;
refuse ambiguous old-window discovery rather than choosing a random window.

Parent-folder VS Code startup tasks first resolve the bundled helper command
cloudigniter.workspaceTerminals.closeAll. Require a trusted local workspace and
close every integrated terminal in that window through the VS Code terminal API;
await onDidCloseTerminal for all existing terminals before returning a string for
the task command variable. Resolution happens before a cleanup task terminal is
created. Empty windows succeed; incomplete closure stops startup. Keep this explicit
startup cleanup outside the HTTP bridge and ordinary dev open terminal calls.
Contribute the command for activation and keep the VSIX/bridge version tied to the
bundled manifest. Sequence cleanup before the parallel site/package launch group.
Parent-folder VS Code tasks set cwd to the child monorepo and use these commands.
Package launcher panels close after successful completion; the helper creates the
persistent terminals. Set CLOUDIGNITER_TERMINAL_PRESERVE_FOCUS=1 for these background
launchers. Keep automatic tasks restricted by Workspace Trust. The parent's .vscode
files are outside monorepo Git and must be shared separately when needed.
Update `company-developers/tooling/dev/workspace-tools.mdx`, the five workspace
command manuals, the command catalog checker and README with contract changes.
Cover nested cwd, outside guards, invalid input, build selection, script retention,
readiness, failed startup, public-file confinement, matched-server restart,
unrelated-listener refusal and owned-process shutdown.

## Publisher implementation

Publisher is private DEV tooling. `src/publisher.mjs` owns the authenticated
loopback HTTP lifecycle; `publisher-workspace.mjs` owns target discovery and
confined configuration/build reads; `publisher-actions.mjs` maps available actions
to existing commands; `publisher-jobs.mjs` owns serialized subprocesses and bounded,
redacted output. Static assets ship in `src/publisher/assets`. Keep Next.js and
provider runtime dependencies out of this tool, as with the existing standalone CLI UI.

Reuse `CiAlertDialog` through `@cloudigniter/ui/client` for draft-discard confirmation.
`publisher-feedback.mjs` bundles the installed public component, React and React DOM
in memory for the exact `/feedback.js` route. Keep only feedback code in the emitted
browser bundle; never import application, Next.js or provider runtime modules.
Use the component's optional `portalContainer` inside a native modal layer above
the retained configuration dialog, with Publisher's semantic tokens applied to
the shared data-slot structure. Keep editing and Escape preserve the draft;
Discard changes resumes only the requested navigation. `assets/discard.mjs`
serializes confirmations and binds consent to the same draft contents, loaded
version and dialog revision. Await discard checks in every dialog/file transition;
block them during saves and preserve drafts on load failures. Do not use `confirm()`.

The authenticated, explicitly confirmed shutdown endpoint waits for an accepted
mutation, stops and awaits running jobs, then closes HTTP and resolves the CLI
lifecycle. Reuse that lifecycle for Ctrl+C/SIGTERM. Stop client polling and dispose
editor models on shutdown; show a closed-session page when the browser refuses
`window.close()`. Keep cancellation and completed-write semantics explicit.

Use the System → Light → Dark icon cycle, persisted in `publisher-theme`, and
resolve System from the OS preference. The configuration editor uses local Monaco
ESM assets bundled in memory on first use by `publisher-editor.mjs`; Monaco and
esbuild are runtime DEV dependencies. Serve only the generated asset inventory,
including local workers/fonts. Keep scripts/workers same-origin; inline styles
are allowed for Monaco's runtime layout/theme rules. Keep folding, Find and syntax
colors with no line numbers, minimap or language-service completion popups.
Keep the editor host and its filename/status/action rows mounted at stable heights
during file loading. Reuse the editor instance and replace/dispose its file models;
keep the previous file read-only and saving disabled until the new file is ready.
Preserve draft checks, revision-bound saves, loading races, model disposal and
theme synchronization. Scope Publisher's generic form styles away from Monaco.

Configuration saves require an inline, read-only Monaco diff before Apply changes.
Bind the review to the exact filename, loaded revision and immutable draft contents;
disable file selection and editing during review, wait for diff computation before
enabling Apply, and provide Back to editing without writes. Show additions/removals
with colors and +/- indicators, include whitespace changes, and dispose review
models on exit/close/shutdown. Save only the reviewed file; preserve drafts on failure.
Keep the review mounted and locked behind an accessible progress notice with a
reduced-motion-aware spinner until both the actual file write and workspace refresh
finish. Report completion only after refresh. A failed write retains the review;
a refresh failure after a successful write reports saved-with-refresh-warning and
returns to the editor without offering a duplicate write. Ignore stale dialog/draft
callbacks after shutdown, and always clear pending state on completion or failure.

Confine the configuration inventory to Changesets, top-level CloudIgniter policy
files and template overlays, all four CloudIgniter quality workflows, source-mirror and npm-stage,
review ownership/templates and npm/pnpm manifests. Target files include Publisher
metadata and DEV recipes; only package targets expose compiler, bundler,
obfuscation, coverage and named DEV build/switch/entry configurations. Exclude
Turbo, Next.js/Docusaurus configuration, unrelated workflows and arbitrary script
configs from both discovery and read/write authorization. Extend the inventory
deliberately when a new CloudIgniter publishing/build configuration is introduced.

Navigation uses Packages, Websites and Templates dropdowns, followed by a direct
Docs control. Alphabetize detected choices by display label and omit empty groups;
never invent an entry for an absent future project. `kind` metadata determines the
group (`app` and `template` share Templates); `label` supplies display names such
as JODARIS Website and cloudigniter-next-aws-v1 without renaming package identities.
Keep the selected target authoritative for actions and destinations. Preserve
keyboard menu navigation, focus restoration and selection across workspace refreshes.
The browser grouping helper lives in `src/publisher/assets/navigation.mjs`.

Infer package scripts; use optional root `publisher.config.json` for non-inferable
project facts, optional workspaceName terminal aliases and reviewed local scripts. Detect manifest-less static sites only
with explicit metadata. Do not invent a publishing route for an unmapped project.
The server must retain loopback-only binding, finite bearer sessions, same-origin
host checks, per-action allowlists, preview revalidation, no arbitrary shell/file
API, symlink refusal, stale-editor checks, and serialization of mutations.

Profile selection uses existing scoped credentials and must not switch global gh
login. Keep selected identity and explicit destinations visible. Expose existing
quality/review/archive safeguards without bypasses; website workflows are scaffolded
locally and artifact delivery remains external. Final npm 2FA and PR management
are outside this GUI version. Update the Publisher workflow and command manuals
with changes. `package build --obfuscation=configured|on|off` changes only the
obfuscation step; default preserves the existing recipe and quality gates.

Publisher's Git summary describes only the local integration-workspace checkout;
target source/build destinations come from the explicit repository inventory,
independently of its backup remote. External standalone clones do not become tabs
or acquire per-target Git status automatically. Do not describe those clones as
replacements for the required shared workspace. An unverified username comes from
profile configuration until its stored credential is checked against GitHub. For a
missing native GitHub CLI, use DEV's existing managed setup/postinstall mechanism;
do not add an unrelated npm package named `gh` or change global authentication.

The selected company development model uses a full private monorepo and one
integrated feature PR for related template/package/docs changes. Approved merges
authorize source mirrors through the implemented post-merge service and configured
company App; remaining release phases follow the target [delivery design](publishing.md#target-automated-monorepo-delivery-design).
Generated release PRs, verified CI handoff and persistent Publisher release
tracking remain proposed. Keep current actions and source/build approval records
honest until the versioned coordinator contract is implemented; reuse DEV domain
services across CLI, GUI and CI rather than creating GUI-only release rules.

## Native GitHub CLI dependency

`gh` is an executable prerequisite, not an npm library. The package postinstall
hook and `dev github setup` share one installer. Reuse a stable system version in
the pinned release's major and at least its version; otherwise use the pinned
official binary for macOS/Linux/Windows x64/arm64. Update the version and all
SHA-256 digests together from the official immutable GitHub release. Keep the
upstream license. Validate a real downloaded archive as well as offline fixtures.

- The hook is best-effort; failed provisioning must not block offline maintenance.
  `CLOUDIGNITER_SKIP_GH_INSTALL=1` skips only the hook. Explicit setup fails with
  exit 1 on operational errors; `--check` resolves without writes or downloads.
- Respect package-manager script approval. Do not enable all dependency scripts
  or use ordinary commands to bypass a blocked install hook. Explain explicit
  setup and scoped pnpm approval in the guide.
- Use a per-user cache or absolute `CLOUDIGNITER_TOOLS_DIR`. Never install globally,
  elevate, change shell PATH, replace another tool or authenticate during setup.
  Setup is deliberately allowed outside workspace guards.
- Restrict HTTPS downloads to official release hosts, limit bytes/time/redirects,
  verify the pinned archive hash before extraction, extract known members into
  buffers, verify the binary version and atomically activate a unique staging
  directory. Keep an integrity receipt and refuse a changed cached executable.
- Serialize same-version installs with an exclusive lock. Preserve other files
  and stale locks for inspection; clean only the invocation's staging and lock.
- Resolve every DEV `gh` call through `runtime.mjs`, preserving arguments, cwd,
  timeout and profile environment. Use the resolved absolute executable and ignore
  package-local PATH shims. Ordinary GitHub operations must never download tools.
- Login remains an explicit interactive company operation. The managed copy uses
  GitHub CLI's normal credential storage; do not create a separate token store.

## Shared package workflows

Company developers use `dev package <action>`, resolved through `pnpm exec dev`
inside a package or `pnpm --filter @cloudigniter/<name> exec dev` from the root.
Keep package scripts as compatibility aliases. DEV's self-scripts bootstrap with
`node ./bin/dev.mjs`; CLI's contributor scripts use the root workspace DEV binary
without adding a public CLI dependency on private DEV. `pnpm dev` remains the
platform package's watch script, not a way to pass arbitrary DEV subcommands.

Seven packages have `ci-dev.config.json`: Core, AWS, EmberGuard, UI, Next, CLI and
DEV. Preserve their exact selected suites. Keep configuration, tests, compiler and
bundler files, generation implementation, coverage policy and artifact validators
with the package. Shared execution belongs in DEV, not duplicated shell scripts.
`config-ts`, applications, guide tooling and root Turbo orchestration are outside
this migration. Core's specialized `forms:generate` remains a local generator.

- Shared commands: `clean`, `clean-types`, `build-js`, `build-types`,
  `build-types-raw`, `build-assets`, `watch`, `typecheck`, `test`, `check`,
  `quality`, `check-package`, `release-check`, `prepublish`, `test-build-gate`.
  Existing full build, switch, map/declaration cleanup and obfuscation remain.
- `typecheck --scope=source|tools|tests|all` defaults to source and always uses
  `--noEmit`. All means all configured scopes, not guessed files. Reject missing scopes.
- `test --filter=<text>` supports repeated OR filters for local feedback. Watch
  uses `--watch`. `--coverage` requires a complete suite and `coverageCheck`; reject
  watch or filters with coverage. Fail empty selection, preserve TSX test aliases,
  and retain Next's timeout/JUnit/no-skips/no-TODO behavior.
- `beforeBuild` calls Core generation once before full builds, standalone JS
  builds and watch startup. A failed hook must stop before subsequent build work.
- `check`, `quality`, `prepublish` execute validated, non-recursive ordered recipes.
  Never introduce recursion through the package script that invokes DEV. Check
  permits primitive checks; quality may include check; prepublish may include both.
- Next's quality recipe runs coverage, the shipped build-gate regression, source/
  tools checks and test typing. Its build config still gates before cleanup.
  Its prepublish recipe runs quality then artifact validation. CLI/DEV checks
  still run source typing plus tests; other platform quick checks still run source/
  tools typing. Do not silently expand the coverage rollout to every package.
- Unknown config keys and missing capabilities fail. Validate local hook files,
  including symlink resolution, before execution. Hooks are reviewed package code;
  they must not recurse into their own command. Asset-free packages report no assets.
- Keep build prerequisites and pack contents documented. Build primitives and
  watch are not release proof; release-check/prepublish never imply approval.
- Generate shared command help from the command catalog and support both `-h`
  and `--help`. Update the guide's script mapping whenever aliases or options move.

The guide's `company-developers/tooling/dev/package-workflows.mdx` explains package
workflows; adjacent `package-configuration.mdx` owns configuration and
`package-scripts.mdx` maps compatibility aliases. Command syntax and options belong
in `docs/commands/dev`. New reusable behavior needs success, denial and failure-order tests.
Do not move package policy into hard-coded name checks in DEV.

## Public template export

Template export/check belong to private DEV; exported applications use public `ci`
and published platform packages. Do not add DEV to the public application or copy
company Git history. Export/check perform local preparation only, with no npm,
GitHub, install, build or cloud subprocesses. Publication is a separate private
request and approval-checked delivery; see [publishing](publishing.md).

- Require an external output directory with an existing parent. Refuse existing
  output by default; export-only `--overwrite` explicitly authorizes replacing the
  whole directory, including stale files and customizations. Validate the complete
  plan and stage all replacement files before deleting the existing output. Recheck
  directory identity and guards before removal. Refuse files, symlink destinations,
  workspace descendants/ancestors, home/current directory ancestors, and outputs
  inside or containing Git checkouts (including `.git` worktree files). Unlink nested
  symlinks without following them. Omit `--overwrite` from `check`.
- `--dry-run --overwrite` validates and previews replacement without writes or
  deletion. Report `wouldReplace` for an existing destination selected for replacement
  and `replaced` only after successful replacement. An absent output is created
  normally even when `--overwrite` is supplied.
- Resolve `--policy` from the workspace root, defaulting to
  `.cloudigniter/template-policy.json`, schema 1. `--source` overrides that policy's
  source and is always workspace-relative. Any folder name/nesting below `apps` is
  supported, including quoted spaces; never hardcode `apps/templates/cloudigniter-next-aws-v1` in dispatch.
  Require an actual source `package.json`, reject bare `apps`, traversal, absolute
  source paths and symlinks, even if policy overlays supply all exported files.
- `--name` overrides the exported package name independently of source/output folder
  names; accept lowercase letters/digits, dots, underscores, hyphens and optional
  `@scope/`, with each name/scope starting with a letter or digit and at most 214
  characters total. Folder names do not inherit package-name restrictions.
- Omitted flags preserve the default policy's source/name. Use independent policies
  for different layouts. CLI overrides never mutate policy or source, and `check`
  requires the same selections. Include resolved source, policy and name in output.
  Keep the output external; only source selection is confined under `apps`.
- `files` is an exact source inventory; `overlays` maps distinct exported paths
  to confined workspace files.
  Overlay inputs stay workspace-relative regardless of policy location. File lists
  and rewrite targets are relative to the selected source. Source selection must
  not implicitly change file lists or rewrite patterns; review path rewrites when
  moving an application deeper in `apps`. Export does not depend on pnpm package-glob
  membership of a nested source directory.
  New files require policy review. Reject symlinks in every input path component,
  traversal, private/generated paths, duplicates and file/directory collisions.
- `versions` explicitly approves public CloudIgniter dependencies. Default to those
  independent exact versions; `--package-version` overrides all of them. Remove only
  config-ts, using standalone configuration. Runtime platform packages belong in
  dependencies; public CLI remains a development tool. Never export private DEV.
- `dependencyVersions` pins/adds third-party dependencies. Existing ranges must
  accept the pin. Preserve explicit dependency patches; currently Next 16.2.2 uses
  the reviewed root patch and standalone pnpm configuration.
- `scripts` replaces the application script map. Keep local AWS profiles out of it.
  Text replacements require exactly one match and fail on drift. Preserve next-intl
  plugin composition when adjusting Turbopack root, and scan installed distribution
  JavaScript for Tailwind. Maintain standalone overlays when source configs change.
- Omit deployed outputs, personal root-user/account configuration, environment
  files, retired examples and tests tied to the monorepo. Ship reserved example
  seed-user addresses. Review new public assets; pattern scanning is not a complete
  confidentiality review. Do not invent a license or infer a GitHub repository.
- Read/validate the complete plan before writing. Dry-run must not create output.
  Deterministic hashes describe bytes, not approval. Clean up only the temporary
  sibling directory created by the current replacement operation. Filesystem
  failures after deletion starts can leave a missing or partial output; report
  failure and require a fresh invocation instead of retrying removal implicitly.
- `check` compares all files against current working-tree inputs. Run it before
  Git initialization, install or build; extra files fail. Use a separate copy for
  application validation. Registry availability and application build are separate
  release requirements, especially before the initial public package publication.

Update `company-developers/tooling/dev/template-export.mdx`, its adjacent
`template-policy.mdx`, and the affected `commands/dev/template-*.mdx` manuals with
each contract change. Keep fixture regressions and the real policy/import-closure test current.
The DEV quality workflow exports and checks a candidate artifact on Node 24 without
publishing. Public repository review, licensing, lockfile generation, registry
installation and backend-dependent application builds remain publication handoff.

## Release-request invariants

- In paired mode, `publish` previews Changesets versioning in a temporary workspace
  and submits concrete source snapshots. Never add local version writes, package
  builds, registry calls or approval to submission. Legacy monorepo requests retain
  their intent-only format.
- Calculate versions and dependency propagation through Changesets, including
  pending Changesets. Validate every resulting package against policy.
- Preserve `fix`/`patch`, `feature`/`minor`, pre-1.0 `breaking`, explicit `major`,
  and `initial` semantics. `initial` targets `0.1.0` only from a lower version.
  `--changed` means pending Changesets, not a source diff. Honor prerelease state
  and disallow `latest` for prerelease versions.
- `--access` asserts policy; it never changes visibility. `private` means npm
  `restricted`; manifest `private: true` prevents publication altogether. DEV
  itself remains restricted. Do not expose arbitrary npm flag passthrough.
- Use the explicit policy target, never an inferred remote. Validate summary,
  package paths, registry, channels, access and reviewers before remote writes.
- Require a clean integration base branch. Paired destinations have independent
  Git histories; use each destination base as parent. Recheck local inputs, policy
  and remote HEAD before writing; legacy mode retains matching-monorepo-SHA checks.
- Remove the requester from reviewers and require another configured individual
  account in paired mode. Legacy intent requests may use teams. GitHub must
  independently enforce approval; two accounts do not imply two people.
- Use deterministic request branches; recover identical requests without
  overwriting edited branches or local files. Reject competing pending requests
  and incomplete bounded listings. Do not imply cross-client locking.
- Send GitHub JSON bodies through stdin with shell-free argument arrays. System
  `git` and resolved system/managed `gh` use `preferLocal: false`; preserve explicit cwd,
  non-interactive execution and bounded timeouts.
- Keep status honest: merged intent is not proof of approval, a successful
  publishing workflow, or registry publication.
- GitHub/npm permissions enforce authorization. CLI checks do not configure
  branch protection or block another npm client. The separate version/candidate/deliver
  commands verify requests, run package gates and bind exact archives to the reviewed
  commit. Final approval uses native npm 2FA. Preserve Next's enforced gates.

## Extending the toolkit

1. Identify the company workflow, owning package, command grammar and observable
   result. Define read/write effects, permission requirements, non-interactive
   inputs, retry behavior and output/exit-code contracts before implementing it.
2. Reuse parsing, runtime and workspace infrastructure. Add a focused worker or
   domain only when needed; keep business behavior out of the executable shim.
3. Keep company configuration in versioned policy. For schema or request-metadata
   changes, define compatibility with existing files and outstanding requests;
   do not reinterpret an old request silently.
4. Add meaningful regression coverage for success, invalid input, policy refusal,
   side-effect boundaries and recovery. Simulate remote systems in tests.
5. Update help, affected scripts, package README, this reference and the developer
   guide in the same change. Review compatibility before changing commands or JSON.

Template delivery and npm staging are covered by [publishing](publishing.md).
Additional npm administration remains future scope. Committed workflows do not
configure remote authorization or authorize live publication during development.

## Keep the skill and guide current

Treat these as living documentation, maintained alongside DEV development:

- **Skill:** keep implementation boundaries and extension rules here. Update
  `SKILL.md` routing only when a new reference is needed; keep generic CLI rules
  in the shared reference.
- **CloudIgniter Developers:** maintain
  `docs/company-developers/tooling/dev/index.mdx` for the toolkit
  introduction, `workspace.mdx` for setup/migration, `architecture.mdx` for
  implementation ownership, and `release-requests.mdx` for review workflow and
  recovery. Keep exact commands and options in `docs/commands/dev`;
  keep GitHub/npm setup in the publication chapter.
- **Package contract:** keep `packages/dev/README.md` and executable help aligned
  with actual supported behavior. Update the shared CLI inventory when commands
  are added or removed. Explain any breaking migration in the relevant guide.

Mark capabilities as implemented, awaiting configuration, or proposed. Promote
a proposal only when its implementation and validation exist. Record remaining
setup separately from missing features. Avoid fixed test counts and dated status
claims that become stale after the next change. Follow the guide-authoring skill
for server lifecycle, page dates and documentation checks.

## Validation

For package behavior changes, run:

```bash
pnpm --filter @cloudigniter/dev check
pnpm --filter @cloudigniter/dev check:package
```

For executable/distribution changes, also pack and install the archive into an
isolated consumer and exercise its entry point. Maintain the Node 22/24 quality
matrix until the supported runtime policy changes. No test may create live PRs
or publish packages. For documentation-only changes, validate the skill and guide;
package tests are unnecessary unless an unresolved behavior claim needs checking.

An independent website terminal also requires `--external`; the bundled VS Code
terminal helper stays confined to the integration workspace. Workspace startup
launches Docs/templates/packages only; website tasks require explicit manual selection.
