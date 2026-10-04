# TDD and Package Release Gates

## Scope and ownership

The first enforced package is `packages/next`. Test and coverage configuration belong there. The shared DEV build executor honors an optional package-local `qualityScript` before cleaning, export switching, or compilation. Next opts in with `qualityScript: "quality"`. Do not migrate other packages implicitly.

## Red–green–refactor

1. Identify observable success, denial, malformed-input, provider-error, and compatibility behavior at the owning runtime boundary.
2. Add a focused failing behavior test under `packages/next/__tests__`. Run `pnpm --filter @cloudigniter/next exec dev package test --filter=<path-fragment>` and record the expected assertion failure. Syntax/import errors do not establish a behavioral red phase.
3. Implement the smallest package-owned correction and rerun the focused test.
4. Refactor with green tests, then run `pnpm quality:next`.
5. Include red/green commands, test results, coverage impact, and documentation changes in the PR. CI verifies outcomes; reviewers verify test-first evidence.

Use the existing `node:test`, strict assertions, real NextRequest/Response objects and deterministic fixtures. Mock only framework/provider/network boundaries. Keep AWS credentials, cloud mutations, real network requests, and arbitrary timing out of this suite. Use rendering/consumer tests where behavior crosses packages. Browser end-to-end tests and live provider smoke tests are separate validation needs, not coverage supplied by this offline gate.

Keep test editor configuration aligned with the CLI: `packages/next/__tests__/tsconfig.json` extends `../tsconfig.test.json` so TypeScript discovers a configured project when a test is opened directly. The production `tsconfig.json` includes only source; the named test config is explicitly selected by the runner and test typecheck. Import other packages through their public entries, such as `@cloudigniter/core/lib` and `@cloudigniter/core/types`. For editor-only module errors, inspect the file's assigned TypeScript project instead of assuming a passing CLI check proves editor configuration works. Keep tests outside declaration-build inputs.

## Commands and ordering

State the working directory when giving package commands. At the repository root, use `pnpm quality:next`, `pnpm test:next`, and `pnpm release:check:next`. Inside `packages/next`, the canonical commands are `pnpm exec dev package quality`, `pnpm exec dev package test`, and `pnpm exec dev package release-check`; package scripts remain compatibility aliases, and the same `:next` shortcuts are also supported as aliases. Do not suggest the root's unqualified `quality` or `release:check` as a Next-package selector.

- `pnpm test:next`: recursively discover `.test.ts`, `.test.tsx`, `.test.mjs`, and `.test.cjs`; fail for no matches, errors, cancellations, skipped tests or TODOs. A focused selector is only for local red/green work.
- `pnpm --filter @cloudigniter/next test:watch`: local feedback loop; not a release check.
- `pnpm quality:next`: complete tests and source-mapped c8 coverage, build-gate regressions, package/tool typechecks, and test typecheck.
- `pnpm --filter @cloudigniter/next build` / `build:dev` / `build:prod`: DEV runs quality before all artifact mutations. Legacy `build:dev2` / `build:prod2` aliases use the same gated entry points. Individual build steps and watch mode are development tools, not validated releases.
- `pnpm release:check:next`: fresh gated production build, pack validation, then `coverage/release/publish-request.md`, a tarball and SHA-256. Restores the original package manifest, package tsconfig and template aliases/CSS after the check, including on failure.
- Direct directory publishing invokes `prepublishOnly`: quality plus distribution validation. Source-mode publication fails. Never disable scripts to bypass validation; publish only the approved, verified tarball.

## Coverage policy

`.c8rc.json` measures all active runtime TS/TSX, including unloaded files. Pure types, barrels, retired `delete` files and example-only code are excluded; barrels/exports are separately checked in the packed artifact. V8 execution through existing VM-based fixture loaders may not remap every component; treat missing coverage honestly.

`coverage-policy.json` sets 90% lines, statements and functions and 80% branches **per file** for new or changed runtime files. The rollout records a legacy backlog with SHA-256 hashes and integer percentage floors. An unchanged exception may retain its recorded floor; any byte change activates the strict policy. Coverage may not fall below an unchanged legacy floor. Remove an exception once the file meets the strict standard. Do not rehash exceptions, lower floors, expand exclusions or skip tests to obtain a passing build. New exceptions require an explicit maintainer policy decision and rationale, not an automatic baseline rewrite.

The gate is staged: a green run does not mean the entire existing Next package has 90% coverage. Use the full HTML/LCOV/JSON reports under `packages/next/coverage` to prioritize the remaining legacy files. Provider-boundary, authorization, routing, context and settings cases take priority. Increase coverage floors deliberately as legacy areas are adopted.

## Shared React declaration identity

The workspace override pins `@types/react` to one version for packages and Docs, and the root dev dependency makes that identity available to shared library declarations. Keep it and the frozen lockfile aligned: duplicate React type versions caused install-layout-dependent TS2883 failures in inferred Amplify and icon declarations. Review type upgrades through full workspace typing and production archive checks; do not disable portability diagnostics or rehash coverage exceptions to bypass a build. Runtime source annotations still follow the existing coverage policy.

## Distribution invariants

Next emits every advertised runtime and declaration entry, including the root and `/tooling/modules`. Server and library output retain source-relative paths needed by unbundled RSC imports. Its unbundled RSC output rewrites workspace aliases to declared public imports without changing component directives. Runtime workspace packages belong in `dependencies`; pnpm pack resolves their workspace ranges. Archive validation checks static relative/self imports and runtime dependency declarations as well as export targets, client directives and file hygiene. Do not treat source-mode imports as evidence that the packed artifact works.

## Build and publish review

`packages/dev` supplies `dev npm plan` and `dev npm publish` for version proposals
and GitHub release-intent PRs. That intent is not an artifact approval. The initial
request command leaves local versions unchanged and publishes no registry package.
Paired requests contain versioned source snapshots; DEV deliver opens build-repository
PRs for verified archives before the generated stage-only workflow runs. DEV version/candidate/deliver commands and generated build-repository staging
workflows preserve package-owned gates and exact
archives before native npm approval. Retain all package-owned gates below. See [CLI development](../cli/development.md).

`.github/workflows/next-quality.yml` runs Node 22 and 24 validation, then a fresh production build/pack job and records a publish request with the exact artifact checksum. `dev-quality.yml` checks the toolkit and template export. `packages-quality.yml` runs the existing Core, AWS, UI, EmberGuard and CLI checks/tests and validates exported Config TS presets on Node 22/24, with production builds, packed review artifacts and advertised-entry validation on Node 24. `workspace-quality.yml` runs the root full-workspace typecheck and template tests on both Node versions, builds it on Node 24 and checks/builds Docs and JODARIS. No quality job publishes or needs registry credentials. Require actual successful GitHub job names in branch protection; committing YAML alone does not configure settings or prove a remote run.

Template CI prepares ignored, non-deployable Amplify outputs only when absent and preserves local outputs. Keep the source environment declaration aligned with the provider-generated module; do not require a sandbox for typechecking. Schema tests transform maintained schema definitions offline rather than depend on a developer's deployment snapshot. The template build also runs its existing optional-module/form generators. Legacy workspace-wide module migration checks are separate from this CI gate. Turbo schedules DEV typechecking independently and without caching because DEV is both package build tooling and a UI consumer; this breaks recursive task prerequisites without skipping a check.

A maintainer reviews the CI run, committed SHA, Changeset/version, dependency versions, compatibility notes, full coverage report and artifact hash before approving a publish request. A local dirty working tree is diagnostic evidence only; CI must validate the committed candidate. Publish the exact approved tarball. Any new source change needs a new check and approval. The workspace-wide `release` alias now submits `dev npm publish --changed`; it does not publish directly.

Other packages now have baseline CI coverage through their existing scripts. Next's strict per-file coverage and packed-runtime validation remain its own rollout. Adopt those stronger contracts explicitly per package; baseline green jobs do not prove identical coverage or artifact validation.

## Shared package execution

DEV owns common test discovery, coverage invocation, tool execution and ordered
check recipes. Package `ci-dev.config.json` files retain test selections, enabled
typecheck scopes and local hooks. Next's recipe preserves full coverage, strict
skip/TODO rejection, build-gate regressions, source/tools checks and test typing.
Coverage never accepts filters or watch mode. Use `--filter=<text>` for local
focused feedback; positional Next test selectors are replaced by this flag.

This command migration does not enroll other packages in Next's coverage rollout.
Do not weaken thresholds, rehash legacy coverage entries or replace artifact
validation with a pack preview. See [DEV company toolkit](../cli/dev-toolkit.md)
and the Developers guide's Package commands with DEV page for configuration.
