# Notes

Because the "scripts/modules/ci-install-module-dependencies.mjs" script imports TypeScript
manifests and a TypeScript core library, run it through the tsx loader:

```json
{
  "scripts": {
    "modules:install": "node --import=tsx scripts/modules/ci-install-module-dependencies.mjs",
    "modules:check": "node --import=tsx scripts/modules/ci-install-module-dependencies.mjs --check"
  },
  "devDependencies": {
    "tsx": "catalog:"
  }
}
```

Node’s documentation recommends `tsx` when full TypeScript loading behavior is required.
[Node.js TypeScript documentation](https://nodejs.org/api/typescript.html)

## Usage

```bash
pnpm modules:install
```

## CI Validation

```bash
pnpm modules:check
```

The script updates `packages/next/package.json`, then runs a filtered pnpm installation. pnpm officially
supports filtered installation and all four package dependency sections used above.
[pnpm install](https://pnpm.io/cli/install), [pnpm add](https://pnpm.io/cli/add).

Do not execute the installer automatically during application startup or package `postinstall`. It should be
an explicit development/build-maintenance command because it modifies `package.json` and the workspace lockfile.
