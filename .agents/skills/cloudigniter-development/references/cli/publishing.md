# GitHub delivery and npm staging

Use this with [DEV company toolkit](dev-toolkit.md) for profiles, repository routing,
reviewed source/build handoff, template publication and npm/AWS workflow scaffolds.
Implementation belongs in private `packages/dev`; public `ci` must not depend on it.

## Routing and identities

- `.cloudigniter/repositories.json` is the explicit source/build inventory. Package
  source and build repositories are private under the `cloudigniter-io` organization. The private template
  source is `cloudigniter-io/source-cloudigniter-next-aws-v1`; its public export target is
  `cloudigniter-io/cloudigniter-next-aws-v1`. Preserve the separate private backup.
- `.cloudigniter/release-policy.json` selects `topology: "paired"`, with
  `repository: null`, individual reviewers, npm access and channels. Derive package
  destinations from the validated inventory; never infer them from Git remotes.
  DEV remains restricted on npm; the other six packages are public. GitHub build
  repository privacy does not determine npm access.
- `.cloudigniter/github-policy.json` selects requesters and template request/public
  repositories. `.cloudigniter/github-profiles.json` maps developer to `Shadi-Ayoub`
  and approver to the personal account `jodaris`. Contacts are not authentication identities.
  The repository owner `cloudigniter-io` is an organization and cannot authenticate as a user.
  Optional `github-policy.workspaceRepository` selects the full monorepo PR destination;
  the proposed `cloudigniter-io/cloudigniter` is separate from backup and product pairs.
- Pin credentials per operation with `--profile` or `CLOUDIGNITER_PROFILE`. Fetch
  through `gh auth token --user`, clear competing inherited token variables, verify
  `gh api user`, and inject into only gh/git subprocess environments. Never switch
  the globally active account, persist tokens, print them, put them in arguments or
  preserve secret-bearing subprocess error causes. Unknown policy fields fail.
- Two accounts owned by the same person separate credentials, not human judgment.
  Local policy checks supplement GitHub protections and npm access. They cannot
  demote a personal repository owner or prevent bypass with another client.
- Clone/pull operate only on explicitly selected external checkouts. Pull requires
  an exact HTTPS origin, clean base branch and fast-forward only; never reset or
  overwrite work. Package snapshots do not yet replace the integration workspace's
  shared lockfile, policies, Changesets, workspace dependencies and build setup.

## Paired source and build review

Ordinary workspace PRs use `dev github pr create` with an already-pushed branch,
explicit project and description file. Keep cross-package source, tests, Changesets
and guide updates together. Workspace review precedes paired release approval;
the current release verifier does not automatically attest a monorepo PR's approval.

Everyday GitHub commands live in `github-workflow.mjs`: auth login/status,
repo view, PR list/view/diff/checks/create/review/merge, issue list/view, run
list/view and workflow list. Resolve explicit configured projects (or workspace),
never arbitrary repo arguments or remotes. Use strict per-action flags, profile
credentials, repository identity/visibility checks and shell-free execution.
Browser login is the only interactive gh operation; verify the newly active account
as well as its stored profile. Other profile operations never switch global login.
PR writes require configured requesters/approvers; review/merge rejects self-authored,
draft/closed/wrong-base PRs and requires an explicit exact head SHA. Reviews use
commit_id; merges use --match-head-commit, squash and no admin bypass. GitHub
must enforce reviews/checks. Never add arbitrary gh/token/administrative passthrough.

Name the package CloudIgniter developer toolkit in contributor prose and use `dev`
for its executable. Do not add internal publication terms to the customer Dictionary.
Publishing documentation lives in `company-developers/publishing/`; the overview
retains the former `/company-developers/tooling/github-npm-publishing` URL.

1. `npm publish` requires a clean integration base branch and authorized requester.
   Run real Changesets versioning in a disposable metadata workspace; leave the
   developer's checkout unchanged. Create one private source PR per affected package
   with tracked package-root source, versioned manifest/changelog and common request
   metadata. Exclude generated output, credentials and repository governance.
2. Preserve independent destination history. Record exact Git blob hashes and source/
   build mappings. Delete stale files only from the previous managed source inventory.
   Recovery must preserve edited branches; a multi-repository batch is not atomic.
   Finish creating/recovering all source PRs before merging a partial batch.
3. `npm version` and `npm candidate` require every source PR merged into the configured
   base with another configured account's APPROVED review at the exact head SHA.
   Verify metadata identity and every recorded source blob; reject missing, stale or
   dismissed approvals and bounded/truncated listings. Reapply the recorded Changesets
   plan locally; review and commit version/lockfile changes before candidate creation.
4. Candidate creation requires clean committed versions and exact source inventories.
   Build dependencies, preserve package quality gates and pack exact archives. Next
   must use its `release:check` verified archive/checksum. Use disposable integration
   checkouts because build workers can change export manifests/template aliases.
5. `npm deliver` verifies source approvals and every candidate archive before writing.
   Open private build PRs with immutable `releases/<version>/package.tgz` and manifest.
   Validate mapping, commit, package/version/access/tag, hash and packed metadata.
   Dry runs read GitHub but write nothing. Preserve partial-delivery evidence;
   retrying must not overwrite a merged version or an edited pending request.
6. Generate package build files locally with `github scaffold`. Reviewed workflow
   code stages the exact committed archive without installing/rebuilding package
   code. Require the configured build repository, base, original actor and rerun
   actor; use protected branches/Code Owners plus stage-only npm OIDC. Set package
   `repository.url` to its **build** repository, the actual npm publisher.

Keep legacy single-repository policies functional without routing paired mode through
the old root staging workflow. Root `npm-stage.yml` requires explicit monorepo mode;
paired releases use generated per-build-repository workflows. Root `pnpm release`
still submits requests; it never directly publishes.

## Native npm staging and bootstrap

Native `npm stage publish` requires npm >=11.15.0 and an existing npm package. It
creates an unpublished candidate, unlike a public `staging` dist-tag. Final approval
requires an npm maintainer's interactive 2FA; GitHub approval/OIDC cannot replace it.
Bootstrap initial versions explicitly after owner review; never silently fall back
to direct publication when staging fails. Preserve stage results and error evidence.

Private GitHub sources do not support npm provenance. OIDC does not authorize private
installs or `npm view`; use a narrowly scoped read-only token when needed, including
for DEV. Restricted organization packages require the appropriate paid npm plan.
GitHub private-environment reviewer availability depends on the subscription; never
promise it on Free/Pro/Team. Branch protections and reviewer-only workflow dispatch
remain explicit setup requirements. Verify official docs when these contracts change.

## Template request and delivery

- `template publish` validates the pristine export and records source selection,
  commit and digest in the configured private request repository. Its dry run is
  offline. Require clean source and another individual reviewer. Maintain private
  application source through normal source PRs; requests carry metadata only.
- `template deliver` requires a merged request and configured independent approval
  for its exact head SHA. Verify target, source ancestry and reproducible export
  digest. Its dry run reads GitHub without filesystem or remote writes.
- Public delivery creates a commit with only the public base as parent and performs
  a non-force update. Preserve `.github` governance; delete only stale files in the
  validated `.cloudigniter-template.json` inventory. Use base64 blobs for binaries.
  Never join private/public history or overwrite modified request branches.
- Identical delivery can reuse the existing tree. Races/partial failures need
  inspection and retry, not force pushes or guessed success. This updates a branch;
  it does not create GitHub Release objects or npm versions.

## Website build repositories

`github scaffold <website> --hosting=static` writes a local S3/CloudFront workflow
and Code Owners. Require explicit static hosting, committed `site/index.html`, no
symlinks, protected base and configured approver; upload reviewed bytes without
rebuilding with AWS credentials. Configure OIDC and environment variables
`AWS_ROLE_ARN`, `AWS_REGION`, `SITE_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID` remotely.
The scaffold creates no resources. Do not deploy server-rendered `.next` output as
static files. Formal website source paths remain null until the user chooses them.
Verify AWS's current GitHub OIDC subject format, including immutable IDs for newer
repositories; do not blindly copy an old trust-policy example.

## Validation and documentation

Use simulated GitHub/npm boundaries with real Git/Changesets fixtures. Cover wrong
identity/repository/base, stale/self approval, source/artifact drift, exact access,
public-only history, recovery and partial delivery. Never create live PRs or publish
from tests. Run DEV Node 22/24 checks, package validation, isolated packed-command
validation, generated-workflow syntax checks and the guide lifecycle.

Synchronize help, README, Developers publication/setup/release/template guides,
command inventory and capability status. Remote setup and live staging remain
unverified until the owner configures accounts and runs the reviewed workflow.
