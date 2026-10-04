# CloudIgniter

Private integration workspace for the CloudIgniter packages, application template,
websites, documentation, and developer tooling.

- `packages/`: platform packages and the `ci` and `dev` toolkits.
- `apps/template/`: the reference Next.js/AWS application.
- `apps/jodaris/`: the JODARIS website.
- `docs/`: CloudIgniter Docs, built with Docusaurus.
- `.cloudigniter/`, `.changeset/`, and `.github/`: shared delivery policy,
  versioning configuration, and GitHub workflows.

Use Node 22.14 or newer and the pnpm version pinned in `package.json`:

```bash
corepack pnpm install
corepack pnpm exec dev publisher
```

See [workspace setup](docs/company-developers/tooling/dev/workspace.mdx) and
[GitHub/npm publishing](docs/company-developers/publishing/index.mdx)
for the supported developer workflow. Start Docs with
`corepack pnpm --filter docs start --no-open`.

Commit source, package manifests, the lockfile, shared policy, repository skills,
and application-owned generated registries. Build output, Graphify reports/caches,
local deployment data, environment values, and filesystem metadata are ignored.
Discarded implementations belong in Git history rather than duplicate live files.
