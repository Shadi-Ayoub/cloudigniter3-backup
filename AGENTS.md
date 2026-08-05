# CloudIgniter development instructions

## Repository structure

- `packages/core`: Framework-independent functionality and types
- `packages/aws`: AWS integrations
- `packages/next`: Next.js integrations
- `packages/ui`: Shared UI components
- `apps/template`: CloudIgniter application template

## Development conventions

- Use TypeScript with strict type safety.
- Preserve existing naming and directory conventions.
- Prefer public imports through:
  - `@cloudigniter/core/lib`
  - `@cloudigniter/core/types`
  - `@cloudigniter/next/client`
  - `@cloudigniter/next/server`
  - `@cloudigniter/next/lib`
- Do not import from hidden internal module paths.
- Do not modify generated files or build outputs.
- Preserve unrelated existing changes.
- Run the relevant type checks and tests after changes.
- Use JSDocs comments to provide informative comments to the code reader.
- Always add description in top each helper and component function.
- Use the following TS paths when importing from within the same package/application:
  - `@ci-core/*` inside the `core` package.
  - `@ci-next/*` inside the `next` package.
  - `@ci-aws/*` inside the `aws` package.
  - `@ci-ui/*` inside the `ui` package.
  - `@/*` inside the `template`.
- Always place all type definitions in one place, normally the `types` folder in the root of the package. maintain the folder and file naming convention currently used in the project. You can use nested sub-folders to organise type files.
- In the Decusaurous document code blocks, always enable line numbering and add a title.
