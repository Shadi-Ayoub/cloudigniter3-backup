# @cloudigniter/config-ts

Shared TypeScript configuration presets for CloudIgniter.

## Available presets

- `@cloudigniter/config-ts/base.json`
- `@cloudigniter/config-ts/library.json`
- `@cloudigniter/config-ts/node.json`
- `@cloudigniter/config-ts/next.json`
- `@cloudigniter/config-ts/react.json`
- `@cloudigniter/config-ts/edge.json`
- `@cloudigniter/config-ts/cli.json`

## Usage

### Publishable package

```json
{
  "extends": "@cloudigniter/config-ts/library.json"
}
```

### Node/tooling config

```json
{
  "extends": "@cloudigniter/config-ts/node.json"
}
```

### Next app

```json
{
  "extends": "@cloudigniter/config-ts/next.json"
}
```

---

# 10. How each package should use it

## `packages/core/tsconfig.json`

```json
{
  "extends": "@cloudigniter/config-ts/library.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "tsBuildInfoFile": "node_modules/.cache/tsconfig.typecheck.tsbuildinfo"
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["dist", "node_modules"]
}
```

packages/core/tsconfig.tools.json

```json
{
  "extends": "@cloudigniter/config-ts/node.json",
  "compilerOptions": {
    "rootDir": ".",
    "noEmit": true,
    "tsBuildInfoFile": "node_modules/.cache/tsconfig.tools.tsbuildinfo"
  },
  "include": ["tsup.config.ts"],
  "exclude": ["dist", "node_modules"]
}
```

apps/template/tsconfig.json

```json
{
  "extends": "@cloudigniter/config-ts/next.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

11. Recommended policy for CloudIgniter

Use this matrix:

library.json → all internal publishable packages
node.json → server-only tools and tooling configs
next.json → Next apps
react.json → future standalone React UI packages
edge.json → future edge/middleware-safe packages
cli.json → scaffolding tools and scripts

That is enough. Do not add more presets until there is a real need.

12. Important rules going forward

For CloudIgniter, I recommend these conventions permanently:

tsconfig extends may use package paths after pnpm install
package source configs stay focused on src
tooling configs are separate
public/shared types go into types/ folders
explicit exports only
no wildcard barrels
no mixed client/server exports from one surface unless intentional

13. One small correction to your earlier config pattern

Your config-ts/base.json should not extend a root ../../tsconfig.base.json.

It should be self-contained, exactly as shown above.

Why:

config packages should be portable
relative upward extends makes the package fragile
package-based extends should not depend on repo shape

So this:

```json
{
  "extends": "../../tsconfig.base.json"
}
```

should be removed.

14. Root monorepo tsconfig.json

I also recommend adding a root coordination config:

```json
{
  "files": [],
  "references": [
    { "path": "./packages/config-ts" },
    { "path": "./packages/types" },
    { "path": "./packages/core" },
    { "path": "./packages/aws" },
    { "path": "./packages/next" },
    { "path": "./apps/template" }
  ]
}
```

This helps editor project resolution even if you are not fully using TS project references for builds.

Final recommendation

Your production-grade @cloudigniter/config-ts should contain exactly these presets:

base.json
library.json
node.json
next.json
react.json
edge.json
cli.json

That gives you room to scale without making the config package messy.
