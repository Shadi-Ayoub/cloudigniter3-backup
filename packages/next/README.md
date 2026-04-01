# CloudIgniter Next Settings Package Structure

This archive contains a monorepo-ready reference implementation for the
`@cloudigniter/next/settings` surface inside the `packages/next` package.

## What is included

- `packages/next/src/settings/**`
- integration-ready export files
- `package.json` export map example
- `tsup.config.ts` entry map example
- in-memory store implementation
- layered settings resolution service
- route-aware domain model
- JSDoc across all exported APIs

## Intended public surfaces

- `@cloudigniter/next/settings`
- `@cloudigniter/next/settings/server`

## Intended internal layers

- `common`
- `client`
- `server`
- `internal`

## Notes

- The included store is in-memory for reference and testability.
- The server package is structured so that a DynamoDB-backed store can be added
  later without changing the public service contract.
- `route` remains a domain scope, but persistence is intentionally limited to
  `public`, `private`, and `user` through `CiScopedSettingsScope`.
