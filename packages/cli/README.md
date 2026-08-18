# `@cloudigniter/cli`

CloudIgniter's command-line product has two executables with separate audiences:

- `ci` contains supported application and system-operations commands.
- `ci-dev` contains monorepo-only build, module, and quality commands and refuses to run outside the private CloudIgniter workspace.

Run `ci --help` or `ci-dev --help` for the current command catalog. Public automation should pass `--no-interactive`; maintainer package scripts should supply every required flag so no prompt is needed. Interactive terminals may use guided Enquirer prompts for omitted choices.

The former `cloudigniter` and `cloudigniter-dev` executable names were replaced by `ci` and `ci-dev`; they are not retained as aliases.

The package also exposes `@cloudigniter/cli/tooling/tsup`, `@cloudigniter/cli/tooling/entries`, and `@cloudigniter/cli/tooling/inject-use-client` for package-local build configuration. These are maintainer tooling exports, not application runtime APIs.

Resource generators can use `@cloudigniter/cli/runtime/resource-file-transaction`
to prepare, apply, inspect, and safely roll back bounded application-file
changes. The transaction journal stores exact before- and after-images below
`.cloudigniter/local/resource-studio`; callers must keep that local directory
out of version control. Rollback reports a conflict without changing any target
file when a generated file no longer matches its expected after-image. Public
transaction contracts are available from `@cloudigniter/cli/types`.

## Command conventions

Commands follow `noun verb` groups, use long kebab-case flags, return exit code `2` for usage errors and `1` for operational failures, and execute subprocesses without a shell. Package-local operations use the invoking directory as their scope; workspace operations accept `--workspace-root` and otherwise discover the nearest pnpm workspace.
