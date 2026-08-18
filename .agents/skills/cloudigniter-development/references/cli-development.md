# CloudIgniter CLI Development

Use this reference for `packages/cli`, package scripts that call it, and CLI-facing documentation.

## Table of contents

1. Product and audience boundary
2. Command and flag grammar
3. Implementation structure
4. Terminal UX
5. Subprocesses and errors
6. Compatibility and validation

## Product and audience boundary

Keep one shared package, `@cloudigniter/cli`, with two executables:

- `ci`: supported application-developer and system-operator workflows;
- `ci-dev`: CloudIgniter monorepo build, quality, module-maintenance, and release workflows.

Require `ci-dev` to discover and validate the private CloudIgniter workspace before dispatch. Do not show maintainer commands in `ci --help`. This is a product boundary, not a security control.

Split into separate npm packages only when the executables need independent release cadence, distribution access, dependency weight, or ownership. Do not duplicate parsing, terminal, error, or process infrastructure merely to create separate names.

## Command and flag grammar

Use stable noun-led groups and verb-led actions:

```text
ci <domain> <action> [subject] [options]
ci-dev <domain> <action> [options]
```

Examples:

```text
ci modules validate --root=src/modules
ci amplify bootstrap root-user --profile=developer1
ci-dev package build --mode=prod
ci-dev quality scan-client-directives
```

- Use lowercase kebab-case for commands and long flags.
- Prefer explicit flags in package scripts and CI.
- Reserve positional arguments for the command path and one natural primary operand.
- Reject unknown flags and invalid enums before side effects.
- Keep defaults deterministic and document them in `--help`.
- Treat command and flag names as compatibility contracts; add aliases and deprecation messages before removal.
- Add a new top-level domain only when existing domains would become semantically misleading.

## Implementation structure

Separate four concerns:

1. executable shim;
2. parsing and command dispatch;
3. shared terminal/process/error runtime;
4. focused workers containing the migrated operation.

Use Meow for version/help and strict flag parsing. Keep a discoverable command registry or similarly centralized dispatch catalog as the command count grows. Do not let workers reimplement banners, global errors, prompting, workspace detection, or subprocess policy.

Keep package-specific configuration next to the package that owns it. For example, build-step ordering and entry configuration remain package-local even when the reusable executor lives in `packages/cli`.

## Terminal UX

Apply the production patterns demonstrated by `cli-welcome`, `cli-alerts`, `cli-handle-error`, `cli-handle-unhandled`, `clear-any-console`, Enquirer, and Ora:

- Render a concise welcome only for interactive discovery, not every automation call.
- Make console clearing opt-in and TTY-only.
- Use consistent success, information, warning, and error semantics.
- Use Ora only for a long task whose output is buffered; stop it before printing errors or streamed child output.
- Disable animation when output is not a TTY.
- Use Enquirer only when input and output are interactive. Provide complete flags and `--no-interactive` paths for CI.
- Never prompt after a command has already started a state-changing operation.
- Respect terminal color capabilities and avoid using color as the only meaning.
- Keep normal output concise; put stack traces and diagnostics behind `--verbose`.

## Subprocesses and errors

Use Execa with argument arrays, `shell: false`, an explicit `cwd`, inherited signals, and intentional stdio. Use `preferLocal` for project-installed executables. Never concatenate user input into a shell command.

Resolve application/provider packages from the target application rather than adding provider dependencies to the generic CLI. Keep the CLI package free of dependency cycles with runtime packages.

For application-facing generators such as Resource Studio, keep compilation in the package that owns each artifact and use the CLI only for session UX, orchestration, safe subprocesses, and file transactions. Restrict output to the custom seams in [template-core-custom-boundary.md](template-core-custom-boundary.md), maintain explicit generated ownership, and fail on collisions before applying a plan. Do not add a matching `ci-dev` generator for CloudIgniter-owned resources; maintainers implement those resources natively in the owning package.

### Generated-resource deployment safety

Keep offline generation and provider deployment as separate, explicit operations. For Resource Studio and any equivalent generated-resource deployment:

- require an explicit AWS profile and sandbox identifier for headless execution;
- verify that generated-owned files match the deterministic plan, then hash the exact sorted path/content plan;
- resolve the Region deterministically from `AWS_REGION`, `AWS_DEFAULT_REGION`, or the selected profile, and fail when none resolves;
- run STS preflight and issue a short-lived, single-use in-memory intent bound to profile, identifier, account, caller ARN/identity, Region, and plan hash;
- show the verified account, ARN, Region, profile, and identifier before an interactive Studio deployment;
- at the mutation boundary, consume the intent, recompute the plan hash, repeat identity and Region resolution, reject every mismatch or expiry before spawning Amplify, and pin the verified Region into the child environment;
- after `aws sso login`, repeat preflight and issue a new intent rather than treating login success as target verification;
- give loopback bootstrap credentials, authenticated sessions, and deployment intents finite absolute lifetimes;
- never persist AWS credentials or session tokens, and sanitize credential-bearing object keys plus common secret patterns embedded in log strings.

Use one deployment runtime for browser and headless entry points so safety checks cannot drift. String redaction is defense in depth; command runners and callers must still avoid logging credentials or complete sensitive payloads.

Normalize failures at the executable boundary:

- `0`: success;
- `1`: operational failure;
- `2`: usage, invalid command, or invalid workspace;
- `130`: user cancellation or interrupt.

Preserve the original nonzero subprocess outcome when it carries more specific meaning. Print one actionable summary; include the underlying stack only in verbose mode. Install unhandled rejection guards at the executable boundary and ensure spinners are stopped before exit.

## Compatibility and validation

For every command change:

1. test parsing, help visibility, audience segregation, invalid input, and exit codes;
2. test TTY-independent behavior with complete flags;
3. test the worker from the real package working directory;
4. validate package-local tooling exports and at least one consuming package;
5. run `npm pack --dry-run` and inspect the included files for publishable changes;
6. update template/root package scripts, the user CLI guide, and contributor architecture guide;
7. search for stale direct paths to migrated scripts.

Use the current primary documentation for [Meow](https://github.com/sindresorhus/meow), [Enquirer](https://github.com/enquirer/enquirer), [Ora](https://github.com/sindresorhus/ora), and [Execa](https://github.com/sindresorhus/execa) before adopting APIs whose versions or Node.js requirements may have changed.
