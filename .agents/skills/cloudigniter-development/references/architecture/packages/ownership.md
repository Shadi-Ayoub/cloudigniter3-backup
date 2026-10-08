# Package Ownership

Use this reference to determine the implementation owner before editing code.

## Table of contents

1. Package responsibilities
2. Ownership decision table
3. Examples

## Package responsibilities

### `packages/core`

Own stable platform- and provider-agnostic CloudIgniter APIs:

- public domain contracts and models;
- public configuration contracts;
- generic normalization and resolution helpers;
- framework-independent errors;
- public EmberGuard helpers and all public generic EmberGuard types.

Expose runtime-neutral helpers through an intentional `/lib` entry point and types through `/types`. Do not import Next.js or bind a provider here.

### `packages/emberguard`

Own internal platform/provider-agnostic security capability implementation:

- authorization and policy evaluation;
- generic roles, permissions, scopes, and assignments;
- generic actor/session/claims behavior where internal;
- implementation details hidden by the `core` facade.

Do not put Next.js requests, provider selection, Cognito claims, or application configuration here.

### `packages/next`

Own reusable Next.js-specific CloudIgniter behavior:

- `NextRequest` and `NextResponse` integration;
- proxy/middleware algorithms;
- request-context transport and extraction;
- route rewrites and redirects;
- Next.js server/client adapters;
- next-intl integration helpers that are reusable across applications;
- framework-specific EmberGuard orchestration and provider binding.

Expose stable server behavior through `@cloudigniter/next/server`, browser behavior through `/client`, framework-neutral helpers through `/lib`, and public Next.js-specific types through `/types`.

Application entry files such as `apps/templates/cloudigniter-next-aws-v1/src/proxy.ts` can remain in the template, but they should delegate reusable processing to this package.

### Provider packages

Provider packages such as `packages/aws` own:

- provider SDK integration;
- Cognito, Amplify, and AWS service behavior;
- provider-specific adapters and error translation;
- provider-specific claims and persistence implementation.

Implement generic contracts without redefining them in provider terminology.

### `packages/ui`

Own reusable presentation primitives and shared UI behavior:

- cards, tables, dialogs, buttons, status rows, and layout primitives;
- accessibility and interaction patterns;
- shared visual utilities and generic UI hooks.

Use `packages/next` when a component intrinsically depends on Next.js navigation or request state. Keep application branding and route-specific content in the template.

### `apps/templates/cloudigniter-next-aws-v1`

Own application composition:

- framework entry points including `next.config.ts` and `proxy.ts`;
- application CloudIgniter configuration and thin route composition, with application route definitions under `src/custom`;
- provider selection;
- custom locale registries and overrides;
- core/default pages and layouts; application-specific adapters/content use the explicit custom seams.

Treat the list above as responsibility, not permission to mix ownership in one file. Application-owned route definitions/adapters/content use the custom seams below; root entry points and default system pages remain template core.

The template should demonstrate consumption of package APIs. When an app-local implementation is reusable, extract the behavior before integrating it.

Within the template, CloudIgniter owns core entry points/default composition and application developers own only `amplify/custom/**`, `src/custom/**`, and scoped `(ci-custom)` page trees. Route composition in `src/kernel/server/routes.ts`, Amplify data, and Amplify backend files may remain thin core-managed bridges that strictly compose custom registries/hooks. Do not put user business logic in those bridges or allow duplicate custom keys to override core.

Application-facing generators retain ownership only over their registered entity folders and generated registries inside the custom seams. A collision with core, manual custom, another generated resource, or an unregistered path is an error, not a precedence rule. See [template-core-custom-boundary.md](template-core-custom-boundary.md).

### `packages/cli`

Own reusable command-line product behavior:

- the public `ci` executable for application and system operations;
- command parsing, help, prompts, terminal feedback, error normalization, and subprocess policy;
- shared application module validation and target-project package loading APIs.

Keep application/provider configuration in the target application and package-specific build configuration in the package it configures. Resolve provider APIs from the target application rather than making the generic CLI depend on a provider package.

### Company developer toolkit: `packages/dev`

Own the separately distributed private `@cloudigniter/dev` package and `dev`
executable. It owns workspace-gated package builds, quality scans, Next tooling,
module maintenance, build exports, public template preparation, company policy and GitHub release requests.
It consumes shared module validation and package loading through public CLI APIs;
CLI never depends on DEV. Its CLI and HTTP runtime have no Next.js/provider
dependency. Publisher reuses the public UI alert component and React in an isolated
local browser bundle; shared presentation remains owned by `packages/ui`.

The npm request command versions temporary source snapshots for review; it leaves
local versions unchanged and does not build, pack, approve or publish a release.
Separate DEV version/candidate/deliver commands orchestrate approved version changes,
package-owned gates and native npm staging; final approval requires npm 2FA.
Do not describe a release-intent PR as an approved artifact. Build
workers live in DEV; package-local build configuration stays with each package.

## Ownership decision table

| Question                                                                  | Owner                 |
| ------------------------------------------------------------------------- | --------------------- |
| Generic stable concept or public contract?                                | `packages/core`       |
| Internal generic security algorithm?                                      | `packages/emberguard` |
| Uses Next.js request, response, headers, cookies, navigation, or runtime? | `packages/next`       |
| Uses AWS/Cognito/Amplify-specific APIs or structures?                     | `packages/aws`        |
| Reusable presentation with no application knowledge?                      | `packages/ui`         |
| Selects, configures, or composes capabilities for this application?       | `apps/templates/cloudigniter-next-aws-v1`       |
| Public application commands or shared application module validation? | `packages/cli` |
| Private build/quality/module tooling, build exports or release requests? | `packages/dev` |

If a feature spans rows, split it across layers rather than assigning the entire feature to the first file that needs it.

## Examples

### Template route needs metadata resolution

```text
route metadata contract        → packages/core/types
generic matching               → packages/core/lib
Next.js request adaptation     → packages/next/server
application route composition  → apps/templates/cloudigniter-next-aws-v1/src/kernel/server/routes.ts
custom route definitions       → apps/templates/cloudigniter-next-aws-v1/src/custom/routes
route entry/composition        → apps/templates/cloudigniter-next-aws-v1
```

### Reusable development diagnostic

```text
generic diagnostic types       → packages/core/types
Next.js request inspection     → packages/next/server
reusable diagnostic UI         → packages/ui or packages/next
endpoint activation/config     → apps/templates/cloudigniter-next-aws-v1
```

### Authentication roles from Cognito

```text
generic roles/contracts        → packages/core
internal authorization logic   → packages/emberguard
Cognito group adapter          → packages/aws
request/session orchestration  → packages/next
provider selection             → apps/templates/cloudigniter-next-aws-v1
```
