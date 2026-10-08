# CloudIgniter

Private integration workspace for the CloudIgniter packages, application template,
documentation, and developer tooling.

- `packages/`: platform packages and the `ci` and `dev` toolkits.
- `apps/templates/cloudigniter-next-aws-v1/`: the reference Next.js/AWS application.
- `apps/templates/`: versioned templates; future providers can add siblings such as `cloudigniter-next-azure-v1`.
- The independent CloudIgniter and JODARIS websites are separate, opt-in repositories outside this workspace.
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

Website sources are `cloudigniter-io/cloudigniter-website` and `jodaris/jodaris-website`;
reviewed AWS outputs use `cloudigniter-io/build-cloudigniter-website` and
`jodaris/build-jodaris-website`. Workspace clones and source mirrors exclude both
websites. Grant repository access separately and clone only the selected website:

```bash
dev github clone cloudigniter-website --output=../websites/cloudigniter-website --profile=developer
dev github clone jodaris-website --output=../websites/jodaris-website --profile=developer
```

See [website delivery](docs/company-developers/publishing/websites.mdx) for independent
source review, static artifact review, and the future AWS deployment setup.
