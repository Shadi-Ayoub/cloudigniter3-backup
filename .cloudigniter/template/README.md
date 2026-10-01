# CloudIgniter application template

A standalone Next.js application built with the public CloudIgniter npm packages.
Use this repository as a template for your own application. It contains application
configuration, routes, custom extensions and an AWS Amplify backend.

## Set up your application

1. Install Node.js 22.14 or newer and the pnpm version specified in `package.json`.
2. Run `pnpm install`. The exact CloudIgniter versions in `package.json` must already
   be publicly available on npm. Keep the resulting `pnpm-lock.yaml` in your application.
3. Configure your own AWS credentials/profile and Region, then review
   `cloudigniter.config.ts` and the Amplify backend for your environment. Set
   `CI_ENV_MODE=development` and `NEXT_PUBLIC_CI_ENV_MODE=development` in `.env.local`,
   and `CI_ENV_MODE=development` in `amplify/.env` for a development sandbox.
4. Deploy a development backend with `pnpm sandbox --profile YOUR_AWS_PROFILE`.
   This command creates AWS resources in that profile's account. The resulting
   `amplify_outputs.json` must exist before typechecking, building or running the app.
5. Run `pnpm check` and `pnpm build`, then `pnpm dev` for local development.

The template intentionally excludes deployed backend outputs, local environment
files, AWS account identifiers and root-user configuration. Generate your own
outputs; do not use another application's deployment file. Use `pnpm exec ci --help`
for application operations and explicit root-user/access-control bootstrap setup.
Create your own ignored `amplify/custom/root-user.json` with `email`, `givenName`
and `familyName`. With initialization permissions for your backend, run
`pnpm bootstrap:access-control --profile=YOUR_AWS_PROFILE` followed by
`pnpm bootstrap:root --profile=YOUR_AWS_PROFILE`; follow the password prompt for
the application administrator. This application account is separate from AWS SSO.
Development user fixtures use reserved `example.com` addresses; replace them with
addresses you control before creating users. The fixtures send no invitations.

## Customize

Application customizations belong under `src/custom`, `amplify/custom`, and the
`(ci-custom)` route groups. Retain the core composition files and public CloudIgniter
package imports when extending the application.

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Generate registries/forms and start Next.js development mode. |
| `pnpm build` | Generate registries/forms and build the application. |
| `pnpm start` | Serve the production build. |
| `pnpm check` | Check application TypeScript. |
| `pnpm resources:studio` | Open application resource tooling. |
| `pnpm sso --profile YOUR_AWS_PROFILE` | Sign in to your selected AWS SSO profile. |
| `pnpm sandbox --profile YOUR_AWS_PROFILE` | Deploy/update your Amplify development backend once. |

This application is marked `private: true` to prevent accidental npm publication.
Its source repository can still be public. No package publishing credentials are
needed to install its public dependencies.
