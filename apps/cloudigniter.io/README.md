# CloudIgniter Website

The temporary public CloudIgniter landing page lives in `index.html`. It contains
all styles, SVG artwork and JavaScript, with no framework, font download or asset
dependency. Its design includes responsive layouts, System/Light/Dark themes,
keyboard-operable architecture/workflow tabs, capability dialogs and a pausable
illustration that respects reduced-motion preferences.

From any directory inside the CloudIgniter Workspace:

```bash
pnpm exec dev start website cloudigniter
pnpm exec dev open terminal cloudigniter
```

The development preview uses port `3002`; `--port`, `--host` and `--no-open` are
available. Terminal mode opens a new VS Code integrated terminal by default;
`--external` opens a system terminal window.

Check and prepare the public artifact from the workspace root:

```bash
node apps/cloudigniter.io/scripts/check.mjs
node apps/cloudigniter.io/scripts/prepare-static-deploy.mjs
pnpm exec dev start website cloudigniter --mode=prod
```

The build stages only `dist/index.html`. It refuses symlinked outputs and
unexpected files in `dist`, preserving them for inspection. Upload only that
public output; policies, development instructions and scripts are not site assets.
Publisher discovers the site through `publisher.config.json`, offers its check
and build actions, and uses the `cloudigniter-website` repository pair. CI checks
and stages the same output without deploying it.

`.cloudigniter/repositories.json` maps the source to `apps/cloudigniter.io`. Approved
monorepo merges include this source in the configured automatic mirroring service;
build-repository delivery and AWS deployment retain their separate review/setup.
No account setup, remote publication or deployment is performed by these scripts.

When replacing the static edition with a Next.js application, preserve its source
mapping and `workspaceName: "cloudigniter"`, provide `dev`/`start` package scripts,
and revise the build metadata and CI job for the chosen hosting output. The DEV
start command selects Next.js when it detects a Next dependency. The static
S3/CloudFront workflow requires exported HTML, not server-rendered `.next` output.
