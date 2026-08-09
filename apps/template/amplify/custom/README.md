# Application backend extensions

This directory is the application-owned boundary for Amplify backend changes.
CloudIgniter upgrades may change the sibling core folders, so register custom
resources and hooks in `backend.ts` instead of modifying core manifests.

- `backend.ts` is the central extension manifest. Register function and custom
  resource factories in `customBackendResources`, and add grants, environment
  values, event sources, schedules, or outputs in `ciConfigureCustomBackend`.
- `auth/` contains application Auth configuration.
- `data/schemata/` contains application Data models and operations.

Keep secrets out of this directory and source them from Amplify secrets or the
deployment environment. Run `pnpm test` and `pnpm typecheck` from the template
application before deploying.
