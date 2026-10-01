# `@cloudigniter/cli`

CloudIgniter's public `ci` executable provides application and system operations.
Run `ci --help` for the command catalog and pass `--no-interactive` in automation.
Interactive terminals support guided prompts for omitted choices.

Maintainer commands have moved to the restricted `@cloudigniter/dev` package.
Replace `ci-dev <group> <command>` with `dev <group> <command>` and use
`@cloudigniter/dev/tooling/tsup`, `/tooling/entries`, and `/tooling/inject-use-client`
for package build configuration. The old executable and build exports are removed;
there are no aliases. Application consumers need only this public package.

`@cloudigniter/cli/tooling/modules` exposes the shared read-only module validator
used by both executables. `@cloudigniter/cli/runtime/package-entry` resolves an
installed package export from an explicit target project. These Node tooling APIs
keep application validation independent of the private DEV package. Their input
contracts are exported through `@cloudigniter/cli/types`.

Resource generators can use `@cloudigniter/cli/runtime/resource-file-transaction`
to prepare, apply, inspect, and safely roll back bounded application-file
changes. The transaction journal stores exact before- and after-images below
`.cloudigniter/local/resource-studio`; callers must keep that local directory
out of version control. Rollback reports a conflict without changing any target
file when a generated file no longer matches its expected after-image. Public
transaction contracts are available from `@cloudigniter/cli/types`.

## Command conventions

Commands follow `noun verb` groups, use long kebab-case flags, return exit code `2` for usage errors and `1` for operational failures, and execute subprocesses without a shell. Package-local operations use the invoking directory as their scope; workspace operations accept `--workspace-root` and otherwise discover the nearest pnpm workspace.
