export const ciPublicHelp = `
  CloudIgniter application and operations toolkit.

  Usage
    $ ci <command> [options]

  Commands
    resources studio                  Open the local Data Entity resource editor
    modules validate                 Validate application modules
    amplify bootstrap access-control  Create or verify access-control data
    amplify bootstrap root-user       Create or verify the configured root user
    amplify sandbox bootstrap         Run a one-shot sandbox and both bootstraps
    amplify sandbox deploy            Verify and deploy generated resources once

  Global options
    --app-root <path>       Application root (default: current directory)
    --workspace-root <path> Workspace root used to resolve packages
    --profile <name>        AWS profile
    --identifier <value>    Stable Amplify sandbox identifier (1-15 characters)
    --port <number>         Local Resource Studio port (default: automatic)
    --no-open               Do not open a browser automatically
    --root <path>           Module root, relative to the workspace root
    --no-interactive        Never prompt for missing optional input
    --verbose               Include diagnostic error details
    --clear                 Clear an interactive terminal before rendering
    --help                  Show help
    --version               Show version

  Examples
    $ ci resources studio --profile=developer1
    $ ci resources studio --profile=developer1 --no-open
    $ ci modules validate --root=src/modules
    $ ci amplify bootstrap root-user --profile=developer1
    $ ci amplify sandbox bootstrap --profile=developer1 --identifier=ci-dev
    $ ci amplify sandbox deploy --profile=developer1 --identifier=ci-dev
`;

export const ciDeveloperHelp = `
  CloudIgniter monorepo maintainer toolkit.

  Usage
    $ ci-dev <group> <command> [options]

  Package commands
    package build --mode=dev|prod
    package switch --target=src|dist
    package clean-maps
    package clean-dts
    package obfuscate
    package build-assets

  Quality commands
    quality scan-client-directives
    quality list-client-files --root=src

  Next.js package commands
    next build-theme
    next test-style --style=standard

  Module commands
    modules validate --kind=core|user [--root=<path>]
    modules sync [--check]

  Global options
    --workspace-root <path> Override the detected CloudIgniter workspace
    --verbose               Include diagnostic error details
    --clear                 Clear an interactive terminal before rendering
    --help                  Show help
    --version               Show version
`;
