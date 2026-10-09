# @cloudigniter/dev

Private CloudIgniter company tooling, exposed through the `dev` executable.
The toolkit provides package builds, quality checks, theme generation, module
maintenance, offline release proposals and GitHub review requests. Its `npm`
request command never publishes. Separate `npm version`, `npm candidate` and
`npm deliver` operations apply reviewed versions, verify archives and request build
review. The generated build-repository workflow submits native npm stages. Final approval requires an npm maintainer's 2FA.
Build configuration uses the explicit `@cloudigniter/dev/tooling/*` exports;
release internals remain private.

## Workspace convenience

From any directory inside the private CloudIgniter monorepo:

```bash
pnpm exec dev start docs
pnpm exec dev start template
pnpm exec dev start website jodaris --site-root=../websites/jodaris-website
pnpm exec dev start website cloudigniter --site-root=../websites/cloudigniter-website
pnpm exec dev start template --mode=prod --port=4000
pnpm exec dev open terminal core
pnpm exec dev open terminal @cloudigniter/ui
pnpm exec dev open terminal
```

Default ports are Docs 3010, template 3000, JODARIS 3001 and CloudIgniter Website
3002. Startup defaults to development, preserves package-script hooks, opens the
browser when the server accepts connections and remains in the foreground until
Ctrl+C. Use `--mode=prod` for an existing build, `--no-open` to suppress the browser,
`--host=<IP|localhost>` to change the loopback default and `--port=<1..65535>` to
choose a port. `--dry-run --json` previews the resolved directory and launch.

Running `dev start docs` or `dev start template` again restarts the matching
server in this workspace when its default port (3010 or 3000) is busy, including
an explicit `--port` with that default value. DEV verifies the framework and
project, stops its process tree, waits for shutdown and starts the requested mode
on the same port. After shutdown it retries binding for up to five seconds, with
a progress message while waiting for port release. A still-occupied port fails
before launch without further termination signals. Unrelated listeners, custom-port collisions and website
collisions still fail. Preview never stops a server. Process inspection uses
`ps`/`lsof` on macOS/Linux and PowerShell on Windows.

The independent JODARIS and CloudIgniter static sites require explicit
`--site-root=<external-checkout>` for website preview and terminal commands.
Their project metadata must match the selected alias. Workspace Publisher and
source mirroring exclude them; clone/pull each website only when explicitly selected.
Templates remain in `apps/templates/*` with distinct package identities.

Terminal selection searches registered packages, apps and Docs. Accept a short
name (`core`, `docs`, `jodaris`, `cloudigniter`, `template`), a CloudIgniter manifest
identity, or a qualified registered `packages/<directory>` / `apps/<directory>`
path. Apps require a named manifest or labelled Publisher metadata; `workspaceName`
provides a stable alias independent of the folder. Ambiguous names are refused.
No operand selects the invoking directory. The default creates a **new** VS Code
integrated terminal at the selected directory using the configured terminal profile,
then returns immediately. The invoking terminal stays available and its cwd does
not change. DEV installs its bundled local helper extension on first use; open a
trusted local workspace in desktop VS Code and make its `code` CLI available.
The parent workspace's automatic VS Code startup closes existing integrated
terminals first, waits for their closure, then starts the sites and package shells
in parallel. This cleanup uses the bundled helper's
`cloudigniter.workspaceTerminals.closeAll` command (helper version `0.1.1` or later)
before the first task terminal is created. It applies to the current local VS Code
window; ordinary `dev open terminal` calls keep existing terminals open.
If the helper is disabled or not activated yet, enable it and reload the VS Code
window before retrying. Use `--external` for macOS Terminal, Windows Terminal or
Linux `x-terminal-emulator`. The previous `--in-place` option is removed. An outside
invocation fails, even with `--workspace-root`.

See [Workspace convenience](../../docs/company-developers/tooling/dev/workspace-tools.mdx)
and the [command manuals](../../docs/commands/dev/index.mdx).

## Publisher

Run `pnpm exec dev publisher` from the workspace to open the local publishing GUI
(or `dev publisher` when DEV is on PATH). Use `--no-open`, `--port=0` for an
available port, and `--profile=<name>` as needed. The default port is 4310.

Publisher discovers packages, applications, Docs and explicit metadata projects.
Navigation groups them into alphabetical Packages, Websites and Templates dropdowns,
with a direct Docs control. Only detected projects appear; metadata supplies labels
such as JODARIS Website and cloudigniter-next-aws-v1.
It provides build/test/check actions, source/distribution switches, live command
output and cancellation, release/template review requests, GitHub repository/run
inspection, a publishing flowchart, a linked configuration editor, and a build
directory viewer. The selected GitHub profile, shell account and configured
destination remain visible. Profile switching uses DEV's per-command credentials.

Each command is previewed before execution. Only one job runs at a time; previews
expire after two minutes and configuration edits detect stale drafts. The server
binds to loopback, uses an eight-hour ephemeral session, and keeps bounded job
history in memory. Ctrl+C stops it. Cancellation does not roll back completed
filesystem or remote changes. GitHub login and final npm approval remain terminal
operations; website artifact delivery remains a reviewed build-repository workflow.

Optional `publisher.config.json` describes project labels, repository mappings,
output folders, asset information, explicit static hosting and reviewed local
script commands. Manifest-less workspace websites can use it. External formal websites use explicit checkout preview instead. Ordinary
packages use inferred scripts. Package builds also support
`--obfuscation=configured|on|off`, preserving their existing quality gate and order.

See the [Publisher guide](../../docs/company-developers/tooling/dev/publisher.mdx)
and [command manual](../../docs/commands/dev/publisher.mdx).

## GitHub CLI installation

DEV's `postinstall` hook reuses a stable system `gh` version `>=2.102.0 <3.0.0` or
installs the pinned official release `2.102.0` in a user-owned cache. Managed
binaries cover macOS, Linux and Windows on x64/arm64. Setup verifies the archive's
SHA-256 before extraction and keeps the upstream license with the executable.
It uses system `tar` (ZIP support on macOS/Windows), without administrator access.
Git remains a separate prerequisite.

If your package manager blocks install scripts, approve only this package's hook
under that manager's policy, or run `pnpm exec dev github setup` explicitly.
`pnpm exec dev github setup --check --json` resolves without downloads or writes.
Both commands work outside a CloudIgniter workspace. The hook warns on failure;
explicit setup exits nonzero. Offline package maintenance remains available.

Set `CLOUDIGNITER_SKIP_GH_INSTALL=1` to skip the hook. `CLOUDIGNITER_TOOLS_DIR` can
select an absolute cache directory; otherwise DEV uses the platform's user cache.
DEV invokes its managed copy directly, without changing the shell's PATH or an
existing installation. Normal GitHub operations never install software.
Sign in separately with `dev github auth login --profile=developer` from the
configured workspace. See the [setup manual](../../docs/commands/dev/github-setup.mdx)
for cache paths, package-manager configuration and recovery.

## Migration from ci-dev

All maintainer commands previously shipped in `@cloudigniter/cli` now belong here.
Replace `ci-dev` with `dev`, retaining the command arguments. Add
`@cloudigniter/dev` as a development dependency in each package using its commands
or build exports. Application `ci` commands remain in the public CLI package.

```bash
dev package build --mode=dev --no-interactive
dev package switch --target=dist --no-interactive
dev package clean-maps
dev package clean-dts
dev package obfuscate
dev package build-assets
dev quality scan-client-directives
dev quality list-client-files --root=src
dev next build-theme
dev next test-style --style=standard
dev modules validate --kind=core --workspace-root=.
dev modules sync --check --workspace-root=.
```

Package/quality/Next workers retain the invoking package as their working
directory. Module operations use the workspace root. Maintenance requires a
private pnpm workspace named `cloudigniter` containing `packages/dev`, but does
not require npm release policy, GitHub login or registry credentials. Build/switch
can prompt for omitted mode/target in a TTY; `--no-interactive` requires explicit
values. `--clear` is TTY-only. Worker exit codes are preserved.

Build steps, source switching, obfuscation and module synchronization can edit
files. `modules sync --check` is read-only; plain `modules sync` updates declared
dependencies and runs a filtered install. `package build` retains package-local
`qualityScript` ordering before cleaning or switching outputs. Tests cover that
failed quality checks preserve the previous build.

Build exports have moved from the CLI prefix to:

- `@cloudigniter/dev/tooling/tsup`
- `@cloudigniter/dev/tooling/entries`
- `@cloudigniter/dev/tooling/inject-use-client`
- `@cloudigniter/dev/types` for build configuration types

Keep these in package build configuration, outside application runtime imports.
The `tsup` and `esbuild` build-time peers must be installed by packages using the
tsup configuration. Shared application module validation and target-project
package loading use the public CLI's supported APIs; DEV never deep-imports it.

## Governed package workflows

Use `pnpm exec dev ...` from `packages/<name>`, or select the package from the root:

```bash
pnpm --filter @cloudigniter/next exec dev package test --filter=proxy/login-redirect
pnpm --filter @cloudigniter/next exec dev package quality
pnpm --filter @cloudigniter/core exec dev package typecheck --scope=all
```

`dev -h` and `dev --help` describe every command. Package scripts remain aliases;
use DEV commands for daily work. `pnpm dev` starts the platform package watch script.

| Command after `dev package` | Purpose |
| --- | --- |
| `clean` / `clean-types` | Remove `dist` plus `.tsbuildinfo`, or only `dist/.types`. |
| `build-js` | Run package generation, then tsup. |
| `build-types-raw` / `build-types` | Emit declarations, then bundle them with Rollup (12 GiB heap limit). |
| `watch` | Run generation once and start tsup watch. |
| `typecheck [--scope=source\|tools\|tests\|all]` | Check supported scopes without emitting; source is the default. |
| `test [--watch\|--coverage] [--filter=<text>]` | Run selected tests; repeat filters for OR matching. Coverage requires the full suite. |
| `check` / `quality` | Run the package's quick or full validation recipe. |
| `check-package` | Run the artifact hook, falling back to `npm pack --dry-run`. |
| `release-check` | Run the configured local release validator without publication. |
| `prepublish` | Run lifecycle requirements without publication or approval. |
| `test-build-gate` | Execute the build-gate regressions shipped with DEV. |

Core, AWS, EmberGuard, UI, Next, CLI and DEV own `ci-dev.config.json` files defining
test globs, typecheck scopes and optional hooks/recipes. DEV owns shared execution.
Next retains coverage policy, strict skips/TODO checks, JUnit reporting, artifact
validation and release-state restoration. Core retains smart-form generation,
which DEV invokes before builds. Asset-free packages report that no assets apply.
Other packages are not automatically enrolled in Next's coverage requirements.
Missing quality/coverage/release capabilities fail rather than silently passing.

DEV's own scripts bootstrap through `node ./bin/dev.mjs`. CLI contributor scripts
resolve the root workspace binary without depending on private DEV. Existing
`build:dev2`/`build:prod2` aliases select the ordinary full build modes. Next's former
positional test selectors are replaced by `--filter=<text>`. Partial build/watch
commands never replace full quality and release validation.

See the [CloudIgniter Developers package workflow guide](../../docs/company-developers/tooling/dev/package-workflows.mdx)
for the full script migration table, configuration schema and package comparison.

## Public template export

From the private workspace, export a new standalone application directory:

```bash
pnpm exec dev template export --output=../cloudigniter-template --dry-run
pnpm exec dev template export --output=../cloudigniter-template
pnpm exec dev template check --output=../cloudigniter-template
```

The output parent must exist, and the output must be outside the private workspace.
Export refuses existing directories unless `--overwrite` is supplied. This option
deletes the entire existing output, including customizations and stale files, after
validating and staging the replacement. It rejects symlink destinations, protected
paths and directories inside or containing Git checkouts. `--dry-run --overwrite`
previews replacement without writing or deleting. `--json` reports paths, SHA-256
hashes, validation status and `wouldReplace`/`replaced` flags.

To regenerate an existing export:

```bash
pnpm exec dev template export --output=../cloudigniter-template --overwrite --dry-run
pnpm exec dev template export --output=../cloudigniter-template --overwrite
pnpm exec dev template check --output=../cloudigniter-template
```

`--overwrite` is export-only; omit it from `check`.
Use `--package-version=0.1.0` to override all approved CloudIgniter package pins;
otherwise each package uses its version from the selected policy (default:
`.cloudigniter/template-policy.json`).
Pass the same override to `check`.

The source application can have any folder name or nesting under `apps`. Use
`--source=apps/starters/next-aws` to override the selected policy's source, and
`--name=next-aws-starter` to override the exported `package.json` name. Source paths
are always workspace-relative, even from a package directory; quote paths with
spaces. The source must contain `package.json` and cannot use traversal or symlinks.
Package names may be scoped, such as `@company/next-aws`, and use lowercase letters,
digits, dots, underscores and hyphens; each name/scope starts with a letter or digit.
Folder names are independent of that package name. The complete package name has
a 214-character limit.

For a different application layout, use `--policy=.cloudigniter/templates/next-aws.json`.
Create that policy with its own source, name, approved files, scripts, overlays,
versions and rewrites. Overlay input paths remain workspace-relative, while the
file inventory is relative to the selected source. No automatic file discovery or
fallback to another policy occurs. Repeat all selection overrides for `check`:

```bash
pnpm exec dev template export --source=apps/starters/next-aws \
  --name=next-aws-starter --output=../next-aws-public --dry-run
pnpm exec dev template export --source=apps/starters/next-aws \
  --name=next-aws-starter --output=../next-aws-public
pnpm exec dev template check --source=apps/starters/next-aws \
  --name=next-aws-starter --output=../next-aws-public
```

This example assumes the source matches the selected policy's layout. Omitting
the new flags preserves the default policy's behavior. Overrides do not edit policy
or source files. JSON output records the selected source, policy and application name.

Each policy lists exact public files, standalone overlays, scripts, public versions
and one-match text rewrites. Adding a source file does not automatically export it.
The default policy replaces workspace links, internal TypeScript settings, Tailwind source paths
and the Turbopack root; keeps the next-intl registration; supplies generic seed
users; preserves the pinned Next.js patch; and excludes environment files, cloud
outputs, root-user settings, tests, retired examples and private tooling.

`check` compares the complete directory against current source and policy. Run it
before installing dependencies or initializing Git, since extra files fail. Use a
separate copy for application install/build checks. The command reports registry
availability and application builds as unverified; it performs neither operation.
A reviewed export can later update a public GitHub template repository. These
export/check commands never create repositories, push, deploy AWS resources or approve publication.
Use the separately gated template request and delivery commands below for publication.

See [Export the public application template](../../docs/company-developers/tooling/dev/template-export.mdx)
for policy maintenance, CI artifacts and the publication handoff.

## Local release use

Use Node 22.14 or newer and the pnpm version pinned by the workspace. After
`pnpm install`, run from the CloudIgniter workspace or any of its packages:

```bash
pnpm exec dev --help
pnpm exec dev npm plan fix --package @cloudigniter/core
pnpm exec dev npm publish fix --package @cloudigniter/core --dry-run --json
pnpm exec dev npm plan feature --package @cloudigniter/ui --preid beta
pnpm exec dev npm plan --changed
```

`npm plan` and `npm publish --dry-run` are equivalent, read-only operations. They
require no GitHub login or npm credentials and can inspect a dirty working tree.
The resulting versions are proposals, not reserved registry versions or proof
that a production build passes. Use `--workspace-root <path>` to select another
CloudIgniter workspace explicitly. Release commands never prompt; `--no-interactive` is
accepted for automation.

Once the private package has been published, company members can install it with
their npm read access. Its manifest sets `publishConfig.access` to `restricted`
and its license to `UNLICENSED`. It deliberately does not set `private: true`,
because that would prevent even private registry publication. The workspace root
continues to use `private: true`.

## Release intent and options

| Intent | Rule |
| --- | --- |
| `fix`, `patch` | Patch increment, e.g. `0.1.0 -> 0.1.1` |
| `feature`, `minor` | Minor increment, e.g. `0.1.0 -> 0.2.0` |
| `breaking` | Minor while below `1.0.0`; major afterward |
| `major` | Explicit major increment, including `0.1.0 -> 1.0.0` |
| `initial` | Propose `0.1.0` for packages currently below `0.1.0` |
| `--changed` without an intent | Consume all pending Changesets |

- Repeat `--package` for multiple full `@cloudigniter/...` names. Short aliases
  and arbitrary package paths are not accepted.
- `--changed` means pending `.changeset/*.md` entries, not a git diff. It cannot
  be combined with a bump, `--package`, or `--preid`.
- `--summary` supplies changelog prose. New-intent submissions require it;
  previews can use an automatically generated description.
- `--preid beta` proposes entering a Changesets prerelease cycle. Numbering
  starts at `.0`. Existing prerelease state is honored; a different active cycle
  is refused. Finish a cycle using the reviewed Changesets prerelease-exit
  process before returning to stable versions.
- `--tag` defaults to `latest`, or the active prerelease identifier. Tags must
  be allowed by policy, and prerelease versions cannot target `latest`. A tag
  never makes a public package private.
- `--access public|private|restricted` asserts the approved visibility for every
  planned package. `private` maps to npm's `restricted`; it cannot override
  policy or silently change an existing package's access.
- `--json` outputs structured plans/status/results. `--verbose` prints stacks
  for operational failures. Unknown commands and flags fail before side effects.

All pending Changesets are considered even when `--package` selects new intent.
Changesets combines bump requirements and includes dependent package releases.
The proposal labels each package as requested, pending-changeset, or dependency.
Every resulting package must be allowed by policy. Independent package versions
are retained; the toolkit does not impose a fixed release group.

For the existing six platform packages, currently versioned below `0.1.0`, preview
the initial batch explicitly:

```bash
pnpm exec dev npm plan initial \
  --package @cloudigniter/core --package @cloudigniter/next \
  --package @cloudigniter/ui --package @cloudigniter/emberguard \
  --package @cloudigniter/cli --package @cloudigniter/aws
```

`@cloudigniter/dev` is already versioned `0.1.0` in source. Its first registry
publication is a separate bootstrap of that existing version, not an `initial`
increment. No bootstrap publication is performed by this toolkit.

## Repository policy and profiles

The active `paired` release policy routes packages through private source and
build repositories under `cloudigniter-io`. `.cloudigniter/repositories.json` records all
11 source/delivery pairs. Six npm packages are public; `@cloudigniter/dev` remains
restricted. GitHub visibility and npm access are separate settings.

The developer profile uses `Shadi-Ayoub`; the approver profile uses `jodaris`.
`.cloudigniter/github-profiles.json` stores usernames and roles only. Authenticate
each account with `dev github auth login --profile=<name>`, then select
`--profile=developer` or `--profile=approver` for each command. DEV retrieves the
selected account's credential from gh storage and pins it to the subprocess; it
does not change the globally active account. `CLOUDIGNITER_PROFILE` supplies a
per-terminal default. Never store tokens or passwords in tracked policy files.

```bash
pnpm exec dev github profiles
pnpm exec dev github repositories
pnpm exec dev github check --profile=developer
pnpm exec dev github clone cloudigniter-core --output=../core-source --profile=developer
pnpm exec dev github pull cloudigniter-core --output=../core-source --profile=developer
pnpm exec dev github scaffold cloudigniter-core --output=../core-build-setup
```

Clone requires a new external directory; pull requires a clean checkout of the
configured base branch and exact repository origin, and uses fast-forward only.
Use `--repository-kind=build` to select the build repository. Scaffold writes local
reviewable files only; it does not create repositories, push or deploy anything.

Keep the integration workspace and its root policies, Changesets and lockfile in
the private backup. Individual source repositories hold package-root snapshots;
these clones do not yet provide a standalone replacement for the integration
workspace's cross-package build setup.

## Paired npm requests and delivery

```bash
pnpm exec dev npm publish fix --package=@cloudigniter/core \
  --summary="Describe the correction" --profile=developer
pnpm exec dev npm status 12 --package=@cloudigniter/core --profile=developer
pnpm exec dev npm version --request=<id> --profile=developer
# Review and commit the resulting integration versions/lockfile on the base branch.
pnpm exec dev npm candidate --request=<id> --output=../candidate --profile=developer
pnpm exec dev npm deliver --manifest=../candidate/manifest.json --profile=developer
```

Submission previews real Changesets versioning in a temporary workspace, then opens
one source PR per affected package containing its source, versioned manifest,
changelog and common request metadata. It leaves local versions unchanged and
uploads nothing to npm. Review and merge every source PR as `jodaris` before
applying versions locally. The candidate command verifies that committed package
sources match the exact approved snapshots, runs package gates and records the
archive hashes. Use a disposable integration checkout because existing build
workers can change development aliases.

Delivery creates review PRs in matching `build-cloudigniter-*` repositories with
immutable `releases/<version>/package.tgz` and a manifest. After reviewing and
merging each build PR, `jodaris` runs its generated `npm-stage.yml` workflow with
the version. Configure npm stage-only trusted publishing for that **build**
repository, workflow and `npm-staging` environment. Package `repository.url` must
match the build repository. The workflow stages the reviewed archive without
rebuilding it. Final `npm stage approve` requires an npm maintainer's interactive
2FA. Initial package publication must be bootstrapped separately because native
staging requires an existing npm package.

Legacy single-repository policies and `dev npm stage` remain supported. The root
staging workflow is disabled unless explicitly configured for legacy monorepo
mode; the current paired topology uses the generated per-build-repository workflows.

## Template requests and website deployment

The private template request repository is
`cloudigniter-io/source-cloudigniter-next-aws-v1`; approved exports go to the public
`cloudigniter-io/cloudigniter-next-aws-v1`. The private backup remains separate.

```bash
pnpm exec dev template publish --output=../cloudigniter-template --summary="Update starter" --profile=developer
pnpm exec dev template status 12 --profile=developer
pnpm exec dev template deliver 12 --profile=approver --dry-run
pnpm exec dev template deliver 12 --profile=approver
```

Template publication requests contain metadata and hashes only. Maintain the
private application's source through normal source PRs. Delivery requires the
request to be merged with a configured independent account's approval of its exact
head commit; it reproduces and verifies the export and preserves public-only Git
history. Using two accounts owned by one person separates credentials but does
not create independent human review.

```bash
pnpm exec dev github scaffold cloudigniter-docs \
  --hosting=static --output=../guide-build-setup
```

Static website scaffolds deploy reviewed files committed under `site/` to S3 and
invalidate CloudFront through AWS OIDC. They need explicit AWS environment values
and role trust. They do not create resources or deploy server-rendered Next.js
output. Independent websites have null source paths. CloudIgniter uses `cloudigniter-io/cloudigniter-website` and `cloudigniter-io/build-cloudigniter-website`; JODARIS uses `jodaris/jodaris-website` and `jodaris/build-jodaris-website`.

Follow the complete [GitHub, npm and AWS setup guide](../../docs/company-developers/publishing/index.mdx)
for repository protections, account permissions, npm organization setup, bootstrap,
trusted publishers, AWS variables, recovery and the exact repository inventory.

## Validation

```bash
pnpm --filter @cloudigniter/dev check
pnpm --filter @cloudigniter/dev check:package
```

Tests use real Changesets calculations and temporary Git repositories. The
GitHub and npm boundaries are simulated; tests never create remote PRs or publish packages.
`.github/workflows/dev-quality.yml` validates the package on Node 22 and 24 and
uploads a package archive with read-only GitHub permissions.

## Everyday GitHub work

Use `dev github auth login --profile=developer` (or `approver`) to open GitHub's
browser login and verify the configured account. `auth status --profile=developer`
checks that profile; `github check` additionally checks company identity policy.
Login can change gh's active account; subsequent explicit-profile commands pin
credentials per invocation without switching other terminals.

`dev github repo view`, `pr list/view/diff/checks/create/review/merge`,
`issue list/view`, `run list/view`, and `workflow list` require an explicit
`--project=<configured-id|workspace>`. Use `--repository-kind=build` for a product's
build repository. `workspace` uses `github-policy.workspaceRepository`, with the
canonical destination `cloudigniter-io/cloudigniter`; GitHub enforces its branch rules separately from local configuration.

PR creation requires `--head` (already pushed), `--title` and `--body-file`;
`--draft` is optional. View/diff/checks/review/merge use `--number`; run view uses
`--run-id`. Review requires `--review=approve|request-changes|comment` and a body
file. Review and squash merge require the exact `--head-sha` from pr view and a
configured independent approver. No admin bypass, automatic push or arbitrary gh
argument forwarding is provided. GitHub branch rules must enforce approvals and
checks. See the Publishing section for complete command explanations.

## Automatic private source mirroring

Approved company monorepo merges trigger `.github/workflows/source-mirror.yml`.
The standalone DEV verifier requires exact-head independent approval and all
configured push checks on the merged commit. It then creates a scoped company App
token and mirrors committed roots into their private source repositories. It uses
no dependency install, build or lifecycle hook with that token.

Normal destination commits preserve separate history, binary files and executable
modes. `.cloudigniter-mirror.json` binds managed ownership to the canonical snapshot
and review/check evidence. Conflicting destination edits fail; retries reconcile
successful receipts, and full snapshots catch up intervening merges. Nothing is
force-pushed, staged to npm, deployed or copied into public/build repositories.

Configure the App's selected-repository Contents write permission,
`CLOUDIGNITER_SOURCE_MIRROR_APP_CLIENT_ID` Actions variable and
`CLOUDIGNITER_SOURCE_MIRROR_PRIVATE_KEY` Actions secret before activation.
[Automatic source mirroring](../../docs/company-developers/publishing/strategy/source-mirroring.mdx)
explains setup, source branch rules, status artifacts, recovery and compatibility
with existing paired releases. Generated release PRs and automatic staging remain
later phases.

## Protected CloudIgniter Docs delivery

Docs source remains in the integrated workspace. `cloudigniter-docs` selects
`staticAccess: "cloudigniter-developer"` and a dedicated scaffold. Run the Docs
`build:hosting` command and review `site/public/`, `site/developer/` and their
manifest in the private build repository. The workflow validates output and actual
private S3/CloudFront protection before uploading. It does not publish the combined
maintainer preview or implement a separate Docs account system.

Company content uses the CloudIgniter website's template authentication and
EmberGuard, requiring authenticated exact developer membership and allowed access.
The website's server session/cookie-signer integration and AWS resources still
need setup. See [Docs publishing](../../docs/company-developers/publishing/docs.mdx).
