# CloudIgniter template tooling

Application and system operations are provided by `@cloudigniter/cli`. The template invokes the public `ci` executable rather than owning duplicate scripts.

## Usage

```bash
pnpm resources:studio
pnpm bootstrap:access-control
pnpm bootstrap:root
pnpm sandbox:bootstrap
```

Resource Studio generates application-owned backend and management-page code
offline. AWS SSO refresh and one-shot sandbox deployment are separate, explicit
actions inside the Studio.

Validate application modules from the monorepo root with the public CLI alias:

```bash
pnpm modules:validate:user
```

Framework module dependency synchronization is intentionally separated into the maintainer-only `ci-dev` executable. Do not run synchronization during application startup or `postinstall`; it can update package manifests and the workspace lockfile.
