# CloudIgniter Users Section

Use this reference for application-developer, integrator, and operator guidance in `developer-guide/docs`, excluding `developer-guide/docs/api-reference`.

## Audience and purpose

Assume readers consume CloudIgniter through supported package entry points and application configuration. Teach them how to achieve an outcome safely without requiring knowledge of package internals.

Cover:

- concepts and mental models needed to use a capability;
- setup, configuration, and extension points;
- task-oriented tutorials and end-to-end workflows;
- provider-specific setup when the provider affects application usage;
- user-visible defaults, behavior, constraints, and troubleshooting;
- migration steps for renamed, deprecated, or removed behavior;
- links to exact API reference pages for field-level details.

Keep internal package implementation, maintainer-only invariants, and unpublished extension mechanics in CloudIgniter Developers.

## Public product voice

Write the active Users guide as public documentation for people building, integrating, and operating CloudIgniter
applications. Describe the product directly in the present tense. Readers must not need the prompt, conversation,
issue, implementation sequence, or release discussion that led to the page.

- Lead with what the reader can do, when to use it, and the observable result.
- Describe supported behavior, configuration, defaults, and limitations as product facts verified against source.
- Do not narrate recent work with phrases such as “we added,” “now supports,” “after the latest fix,” “the current
  implementation,” “the tenant pilot,” or “deferred beyond V1.” Remove references to prompts, earlier guide claims,
  contributor decisions, and speculative future capabilities from active concept and workflow prose.
- Preserve real limitations. Replace “not yet supported” with the specific unsupported operation and an available
  supported workflow, where one exists. Never imply production support merely to make the tone sound commercial.
- Use temporal language when it describes actual runtime state or a user task, such as the current actor, an
  expired assignment, or updating a record. Keep version comparisons in explicitly scoped migration or release
  documentation with verified applicability; keep historical material under **Obsulete**.
- Make troubleshooting symptom-driven: explain what to check, what the result means, and how to resolve it.
  Do not assume a particular recent patch, stale personal sandbox, or earlier prompt caused the failure.
- Use neutral example accounts, profiles, and paths. Identify placeholders; do not refer to the template author’s
  personal environment. Distinguish development-only tools from production operations wherever access matters.
- Keep application guidance on the supported public package facade. Do not describe it as a compatibility bridge
  or direct readers to internal packages unless a documented migration explicitly requires that distinction.
- When revising prose or headings, check related Dictionary, Developers, and API links and refresh the page’s UTC
  updated timestamp without changing its created timestamp, following the workflow and validation rules.

Examples:

| Avoid | Prefer |
| --- | --- |
| “The tenant pilot does not automatically empty Trash.” | “Tenants remain in Trash until an authorized administrator restores or permanently deletes them.” |
| “Policy generation is deferred beyond V1.” | “Configure authorization policies separately; Studio does not generate them.” |
| “If this persists after the latest update, redeploy the current backend.” | “Compare the application input with the deployed schema and verify that the outputs identify the intended backend.” |

## Standalone application onboarding

The Users guide targets applications downloaded from `cloudigniter/template-next-aws`, with CloudIgniter
packages installed from npm. Treat that distribution model as the application-facing contract. Use repository
source to verify behavior without exposing the maintainer checkout as the user's installation environment.

- Write paths relative to the downloaded application root, such as `.env.local`, `amplify/.env`, and `src/custom`.
  Do not instruct users to enter `apps/template` or install/build the CloudIgniter monorepo.
- Use application commands such as `pnpm install`, `pnpm sso`, `pnpm sandbox`, and `pnpm dev`. Keep workspace
  filters, workspace dependencies, package-build steps, and `ci-dev` workflows in CloudIgniter Developers.
- Put AWS account, IAM Identity Center, permission-set, local profile, and account/Region bootstrap preparation
  in `docs/getting-started/before-you-start.mdx`, immediately before the run-template page in the sidebar.
- Use **Developer 1** and the `developer1` AWS profile consistently in this onboarding walkthrough. Explain the
  distinction between AWS SSO identities, local profile names, AWS account root, and CloudIgniter application users.
- Order the journey as preparation, template download, npm dependency installation, environment configuration,
  SSO sign-in, sandbox creation, application initialization, and `pnpm dev`. Explain the resulting files and UI
  outcome rather than incidental script internals such as Smart Form generation.
- Verify AWS permissions and console/CLI steps against official AWS sources. Distinguish deployment permissions,
  one-time account bootstrap, and resource-scoped application initialization grants; do not assume the Amplify
  deployment policy includes direct Cognito administration or DynamoDB data access.
- Keep resolved local installation incidents and contributor cache/dependency repair out of the first-run
  learning path. Include troubleshooting only when it helps users complete the documented application workflow.
- Keep the introduction and related guide links pointed at AWS preparation as the first setup step. Preserve
  existing page creation dates and initialize UTC Created/Updated dates for each new page.
- Documentation validation does not prove the standalone release is published or that a cloud deployment was
  tested. Report the verification actually performed; never publish packages or provision AWS merely to edit a guide.

## Choose or create the page

Search the existing concept and workflow hierarchy before adding a page. Prefer updating the page a reader would already visit.

The sidebar follows eight stages: Start here; Architecture and concepts; Configure your application; Identity and
access; Tenants and Org Units; Build features; Data and providers; Testing and operations. The canonical ordering
and page membership live in `developer-guide/user-guide-structure.json`, consumed by `sidebars.ts`.

- Start new readers at `docs/intro.md` and `docs/getting-started`.
- Use `docs/architecture` for application-facing package, ownership, and request concepts.
- Use `docs/configuration`, `docs/identity`, `docs/building-features`, `docs/data`, and `docs/operations` for chapter introductions and current workflows.
- Existing current documents retain their established paths, including authorization and tenancy beneath `docs/core-system`, plus provider, Resource Studio, UI, environment, and testing domains. Sidebar grouping determines their learning order.
- Keep API Reference separate; link to exact contracts from the relevant lesson.
- Keep the Dictionary focused on stable definitions, not complete tutorials.

Every Users page must appear exactly once in the current chapters or beneath **Obsulete**. Put superseded
implementation guides, empty historical drafts, and Docusaurus samples in that single archive. Add a historical
warning and current replacement link. Update inbound links in every guide surface when retiring content; retain
old URLs where practical. Do not replace useful current material wholesale when correcting an import is enough.

Use the [workflow and validation rules](workflow-and-validation.md) when changing navigation. Never restore
root-wide autogenerated Users navigation: it mixes the API Reference and historical documents into the learning path.

## Recommended page structure

Adapt the structure to the task; do not force empty sections.

1. State the reader outcome and when the capability applies.
2. Explain the minimum mental model and prerequisites.
3. Show the supported setup or configuration.
4. Provide a runnable example using public imports and application-owned files.
5. Explain important defaults, lifecycle behavior, and extension points.
6. Cover security constraints, edge cases, errors, and troubleshooting.
7. Link to related concepts, provider guidance, and API reference pages.

For multi-step capabilities, provide a learning path and keep each page focused. For simple behavior, prefer one concise page over a fragmented series.

## Examples and imports

- Use the application template only to demonstrate supported composition.
- Import reusable APIs from intentional package entry points such as `/client`, `/server`, `/lib`, or `/types`.
- Use realistic application paths while making it clear which files are application-owned.
- Include expected output or decision behavior when it removes ambiguity.
- Demonstrate failure or denial paths for security-sensitive and validation-sensitive features.
- Do not expose internal `src` paths or ask application developers to import internal capability packages when the public facade owns the API.

## Quality checklist

- Does the page read as public product guidance without prompt history, implementation milestones, or speculative roadmap claims?
- Do setup paths, package sources, and commands match a standalone npm-consuming application rather than the maintainer monorepo?
- Can a reader identify why and when to use the capability?
- Does the example compile against current exports and types?
- Are configuration defaults and required fields accurate?
- Are server/client/provider boundaries explicit?
- Are common failure modes actionable?
- Does the page link to the exact public contracts rather than reproducing a large reference table?
- Are renamed concepts and old imports removed from related pages?
- Is the next useful step discoverable?
