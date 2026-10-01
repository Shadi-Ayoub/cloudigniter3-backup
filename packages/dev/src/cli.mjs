import meow from "meow";
import { ciSetupGithubCli } from "./github-cli.mjs";
import { ciGithubWorkflow } from "./github-workflow.mjs";
import { ciFindWorkspace, ciReadPolicy } from "./policy.mjs";
import { ciCreateReleasePlan, ciFormatPlan } from "./release-plan.mjs";
import { ciSubmitRelease, ciReleaseStatus } from "./github.mjs";
import { CiDevUsageError, ciErrorMessage } from "./runtime.mjs";
import { ciTemplateHelp, ciRunTemplateCommand } from "./template-export.mjs";
import {
  ciSubmitTemplate,
  ciTemplateStatus,
  ciDeliverTemplate,
} from "./template-publish.mjs";
import { ciGithub, ciStringField } from "./github-api.mjs";
import { ciReadGithubPolicy } from "./github-policy.mjs";
import { ciReadProfiles, ciProfileSession } from "./github-profiles.mjs";
import { ciReadRepositories, ciRepositoryCheckout } from "./repositories.mjs";
import {
  ciDeliverBuilds,
  ciScaffoldBuildRepository,
} from "./build-repositories.mjs";
import { ciRun } from "./runtime.mjs";
import {
  ciVersionRelease,
  ciBuildCandidate,
  ciStageCandidate,
} from "./npm-staging.mjs";
import {
  ciMaintainerHelp,
  ciRunMaintainerCommand,
  ciAssertCommandFlags,
} from "./maintainer-cli.mjs";

export const ciDevHelp = `
  Usage
    dev publisher [--port=4310] [--no-open] [--profile=<name>]
    dev npm plan [fix|feature|breaking|patch|minor|major|initial] [options]
    dev npm publish [fix|feature|breaking|patch|minor|major|initial] [options]
    dev npm status <pull-request-number> [--package=<name>] [--profile=<name>] [--json]
    dev npm version --request=<release-id> [--dry-run]
    dev npm candidate --request=<release-id> --output=<new-directory>
    dev npm stage --manifest=<candidate/manifest.json> [--dry-run]
    dev npm deliver --manifest=<candidate/manifest.json> [--profile=developer] [--dry-run]
    dev <package|quality|next|modules> <action> [options]
    dev template <export|check|publish> --output=<directory> [options]
    dev template status <pull-request-number> [--json]
    dev template deliver <private-pull-request-number> [--dry-run] [--json]
    dev github setup [--check] [--json]
    dev github check [--json]
    dev github auth <login|status> [--profile=<name>]
    dev github repo view --project=<id|workspace> [--profile=<name>]
    dev github pr <list|view|diff|checks|create|review|merge> --project=<id|workspace> [options]
    dev github issue <list|view> --project=<id|workspace> [--number=<number>]
    dev github run <list|view> --project=<id|workspace> [--run-id=<id>]
    dev github workflow list --project=<id|workspace>
    dev github profiles [--json]
    dev github repositories [--json]
    dev github scaffold <project> --output=<new-directory> [--hosting=static]
    dev github <clone|pull> <project> --output=<checkout> [--repository-kind=source|build] [--profile=<name>] [--dry-run]

  Commands
    publisher     Start the local Publisher GUI for builds, checks and release requests.
                  --port=0 selects a free port; --no-open prints the URL only.
    npm plan      Calculate an offline, read-only release proposal.
    npm publish   Submit a GitHub review request. Does not publish to npm.
    npm status    Read the request's GitHub status; publication is unverified.
    npm version   Apply reviewed Changesets and update the lockfile locally.
                  Commit the resulting integration changes before building candidates.
    npm candidate Build/check/pack committed versions and record archive hashes.
                  Requires a clean base branch; use a disposable checkout.
    npm stage     Legacy single-repository CI staging. Paired releases use npm deliver.
                  Requires npm >=11.15.0, existing npm packages and a reviewer
                  triggering the configured company workflow. Never direct-publishes.
                  Final approval uses npm stage approve with interactive 2FA.
    npm deliver   Request review of exact archives in each private build repository.
                  Reads approved source requests; --dry-run reads GitHub but writes nothing.
    github setup  Reuse a compatible gh or install a verified DEV-managed copy.
                  --check resolves without downloading. No workspace or login required.
    github check  Verify the gh account against configured requester/approver identities.
                  Report configured destinations without printing credentials.
    github profiles List named developer/approver profiles without logging in.
    github repositories List each private source and build/public destination.
    github clone  Clone a configured repository into a new external checkout.
    github pull   Update its clean base branch using fast-forward only.
    github scaffold Generate package/npm or explicit static-website/AWS workflow files locally.
    github auth login Open GitHub browser login for the named profile, then verify its account.
    github auth status Verify a profile, or inspect stored GitHub CLI accounts.
    github pr     Inspect requests/checks/diffs; create from an already-pushed branch.
                  Review/merge requires an approver and the exact --head-sha from pr view.
                  GitHub branch protections must enforce required reviews and checks.
    github issue  List open issues or view --number. No remote writes.
    github run    List Actions runs or view --run-id. No workflow dispatch.
    github workflow list List available workflows without running them.

  Everyday GitHub options
    --project          Configured project ID, or workspace for the full monorepo.
    --number           Positive PR or issue number for view/diff/checks/review/merge.
    --run-id           Positive Actions run ID for run view.
    --head             Already-pushed feature branch for pr create.
    --title            PR title for pr create.
    --body-file        UTF-8 description for pr create or review; required.
    --draft            Create a draft PR.
    --head-sha         Exact 40-character reviewed PR head for review/merge.
    --review           approve|request-changes|comment for pr review.
    --repository-kind  source (default) or build; also supported by everyday commands.

${ciMaintainerHelp}
${ciTemplateHelp}
  Release options
    --package          Full package name; repeat for multiple packages.
    --changed          Plan all pending Changesets; omit intent and --package.
    --summary          Changelog description; required when submitting new intent.
    --dry-run          Preview without writes; delivery previews read GitHub.
    --preid            Enter a Changesets prerelease cycle (alpha, beta, rc).
    --tag              Allowed npm channel (default: latest, or active preid).
    --access           Assert public|private|restricted; cannot override policy.
    --workspace-root   Workspace to use (default: discover from current directory).
    --request          Recorded 24-character request ID for version/candidate.
    --manifest         Verified candidate manifest.json for npm deliver (or legacy stage).
    --profile          GitHub profile for this command; also CLOUDIGNITER_PROFILE.
                       Credentials stay in gh storage; no global account switch.
    --repository-kind  Select source (default) or build for github clone/pull.
    --hosting          Use static explicitly for website scaffold; omit for npm packages.
    --json             Print structured output.
    --no-interactive   Release commands never prompt; disables maintenance prompts.
    --verbose          Include diagnostic stack traces on failure.
    --help, -h         Show all commands, package workflows and options.
    --version          Show the toolkit version.

  Examples
    dev npm publish fix --package @cloudigniter/core --dry-run
    dev npm publish feature --package @cloudigniter/ui --summary "Add a menu component"
    dev npm plan feature --package @cloudigniter/ui --preid beta
    dev npm publish --changed
    dev npm status 123

  fix = patch; feature = minor; breaking = minor before 1.0, major afterward.
  initial proposes 0.1.0 only for packages currently below 0.1.0.
  --changed means pending Changesets, not uncommitted files or git diff.
  Submission requires configured reviewers, a clean base branch, and gh login.
`;

/** @param {string[]} [argv] */
export async function ciRunDevCli(argv = process.argv.slice(2)) {
  const cli = (() => {
    try {
      return meow(ciDevHelp, {
        importMeta: import.meta,
        argv,
        allowUnknownFlags: false,
        autoHelp: false,
        autoVersion: false,
        flags: {
          package: { type: "string", isMultiple: true },
          changed: { type: "boolean" },
          summary: { type: "string" },
          dryRun: { type: "boolean" },
          preid: { type: "string" },
          tag: { type: "string" },
          access: {
            type: "string",
            choices: ["public", "private", "restricted"],
          },
          workspaceRoot: { type: "string" },
          port: { type: "number" },
          open: { type: "boolean", default: true },
          obfuscation: { type: "string", choices: ["configured", "on", "off"] },
          output: { type: "string" },
          overwrite: { type: "boolean" },
          source: { type: "string" },
          policy: { type: "string" },
          name: { type: "string" },
          packageVersion: { type: "string" },
          request: { type: "string" },
          manifest: { type: "string" },
          profile: { type: "string" },
          project: { type: "string" },
          number: { type: "string" },
          runId: { type: "string" },
          head: { type: "string" },
          headSha: { type: "string" },
          title: { type: "string" },
          bodyFile: { type: "string" },
          draft: { type: "boolean" },
          review: {
            type: "string",
            choices: ["approve", "request-changes", "comment"],
          },
          repositoryKind: { type: "string", choices: ["source", "build"] },
          hosting: { type: "string", choices: ["static"] },
          json: { type: "boolean" },
          interactive: { type: "boolean", default: true },
          verbose: { type: "boolean", shortFlag: "v" },
          mode: { type: "string", choices: ["dev", "prod"] },
          target: { type: "string", choices: ["src", "dist"] },
          kind: { type: "string", choices: ["core", "user"] },
          root: { type: "string" },
          style: { type: "string" },
          check: { type: "boolean" },
          clear: { type: "boolean" },
          scope: {
            type: "string",
            choices: ["source", "tools", "tests", "all"],
          },
          watch: { type: "boolean" },
          coverage: { type: "boolean" },
          filter: { type: "string", isMultiple: true },
          help: { type: "boolean", shortFlag: "h" },
          version: { type: "boolean" },
        },
      });
    } catch (error) {
      throw new CiDevUsageError(ciErrorMessage(error));
    }
  })();
  if (cli.flags.version) {
    console.log(cli.pkg.version);
    return;
  }
  if (cli.flags.help || cli.input.length === 0) {
    console.log(cli.help);
    return;
  }
  const [domain, command, subject, ...extra] = cli.input;
  if (domain === "publisher") {
    if (command || subject || extra.length) throw new CiDevUsageError("Use dev publisher with named options only.");
    ciAssertCommandFlags(argv, ["port", "open", "profile"]);
    const { ciRunPublisher } = await import("./publisher.mjs");
    await ciRunPublisher(cli.flags);
    return;
  }
  if (domain === "github" && command === "setup") {
    if (subject || extra.length)
      throw new CiDevUsageError("Use dev github setup [--check] [--json].");
    ciAssertCommandFlags(argv, ["check", "json"]);
    const installation = await ciSetupGithubCli({ check: cli.flags.check });
    console.log(cli.flags.json ? JSON.stringify(installation, null, 2)
      : `GitHub CLI ${installation.version} ready (${installation.source}): ${installation.path}`);
    return;
  }
  if (
    domain === "github" &&
    ["auth", "repo", "pr", "issue", "run", "workflow"].includes(command ?? "")
  ) {
    if (!subject || extra.length)
      throw new CiDevUsageError(
        "Use dev github <group> <action> with named options. Run dev --help."
      );
    const root = await ciFindWorkspace(
      cli.flags.workspaceRoot ?? process.cwd()
    );
    console.log(
      await ciGithubWorkflow(root, command ?? "", subject, cli.flags, argv)
    );
    return;
  }
  /** @param {string} root */
  const session = (root) =>
    ciProfileSession(
      root,
      cli.flags.profile ?? process.env.CLOUDIGNITER_PROFILE
    );
  if (
    domain === "github" &&
    command === "profiles" &&
    !subject &&
    !extra.length
  ) {
    ciAssertCommandFlags(argv, ["json"]);
    const root = await ciFindWorkspace(
      cli.flags.workspaceRoot ?? process.cwd()
    );
    console.log(JSON.stringify(await ciReadProfiles(root), null, 2));
    return;
  }
  if (
    domain === "github" &&
    command === "repositories" &&
    !subject &&
    !extra.length
  ) {
    ciAssertCommandFlags(argv, ["json"]);
    const root = await ciFindWorkspace(
      cli.flags.workspaceRoot ?? process.cwd()
    );
    console.log(JSON.stringify(await ciReadRepositories(root), null, 2));
    return;
  }
  if (
    domain === "github" &&
    command === "scaffold" &&
    subject &&
    !extra.length
  ) {
    ciAssertCommandFlags(argv, ["output", "json", "hosting"]);
    const root = await ciFindWorkspace(
      cli.flags.workspaceRoot ?? process.cwd()
    );
    console.log(
      JSON.stringify(
        await ciScaffoldBuildRepository(
          root,
          subject,
          cli.flags.output ?? "",
          cli.flags.hosting
        ),
        null,
        2
      )
    );
    return;
  }
  if (
    domain === "github" &&
    (command === "clone" || command === "pull") &&
    subject &&
    !extra.length
  ) {
    ciAssertCommandFlags(argv, [
      "output",
      "repository-kind",
      "profile",
      "dry-run",
      "json",
    ]);
    const root = await ciFindWorkspace(
      cli.flags.workspaceRoot ?? process.cwd()
    );
    const run = cli.flags.dryRun ? ciRun : (await session(root)).run;
    console.log(
      JSON.stringify(
        await ciRepositoryCheckout(root, command, subject, cli.flags, run),
        null,
        2
      )
    );
    return;
  }
  if (domain === "github" && command === "check" && !subject && !extra.length) {
    ciAssertCommandFlags(argv, ["json", "profile"]);
    const root = await ciFindWorkspace(
      cli.flags.workspaceRoot ?? process.cwd()
    );
    const selected = await session(root);
    const login = ciStringField(
      await ciGithub(root, selected.run)("user"),
      "login"
    );
    const policy = await ciReadGithubPolicy(root);
    const release = await ciReadPolicy(root);
    const authorized = [
      ...policy.requesters,
      ...policy.template.reviewers,
      ...release.reviewers,
    ];
    if (!authorized.some((name) => name.toLowerCase() === login.toLowerCase()))
      throw new CiDevUsageError(
        "The active account is not a configured company requester or approver."
      );
    console.log(
      JSON.stringify(
        {
          login,
          profile: selected.profile,
          ...policy,
          privateReleaseRepository: release.repository,
          releaseReviewers: release.reviewers,
          authorization:
            "GitHub permissions and rules must enforce these settings",
        },
        null,
        2
      )
    );
    return;
  }
  if (domain === "template") {
    if (
      command === "publish" ||
      command === "status" ||
      command === "deliver"
    ) {
      if (extra.length || (command === "publish" && subject))
        throw new CiDevUsageError("Unexpected template arguments.");
      ciAssertCommandFlags(
        argv,
        command === "status"
          ? ["json", "profile"]
          : command === "deliver"
          ? ["dry-run", "json", "profile"]
          : [
              "output",
              "source",
              "policy",
              "name",
              "package-version",
              "summary",
              "dry-run",
              "json",
              "profile",
            ]
      );
      const root = await ciFindWorkspace(
        cli.flags.workspaceRoot ?? process.cwd()
      );
      const run =
        command === "publish" && cli.flags.dryRun
          ? ciRun
          : (await session(root)).run;
      const result =
        command === "status"
          ? await ciTemplateStatus(root, subject ?? "", run)
          : command === "deliver"
          ? await ciDeliverTemplate(root, subject ?? "", cli.flags, run)
          : await ciSubmitTemplate(root, cli.flags, run);
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    await ciRunTemplateCommand(cli.input, cli.flags, argv);
    return;
  }
  if (["package", "quality", "next", "modules"].includes(domain ?? "")) {
    await ciRunMaintainerCommand(cli.input, cli.flags, argv);
    return;
  }
  if (
    domain === "npm" &&
    ["version", "candidate", "stage", "deliver"].includes(command ?? "")
  ) {
    if (subject || extra.length)
      throw new CiDevUsageError(
        "Use named release artifact options; no positional operands."
      );
    ciAssertCommandFlags(
      argv,
      command === "version"
        ? ["request", "dry-run", "json", "profile"]
        : command === "candidate"
        ? ["request", "output", "json", "profile"]
        : command === "deliver"
        ? ["manifest", "dry-run", "json", "profile"]
        : ["manifest", "dry-run", "json"]
    );
    const root = await ciFindWorkspace(
      cli.flags.workspaceRoot ?? process.cwd()
    );
    if (command === "candidate" && !cli.flags.output?.trim())
      throw new CiDevUsageError(
        "npm candidate requires --output=<new-directory>."
      );
    if (
      (command === "stage" || command === "deliver") &&
      !cli.flags.manifest?.trim()
    )
      throw new CiDevUsageError("npm stage requires --manifest=<file>.");
    const run = command === "stage" ? ciRun : (await session(root)).run;
    if (command === "deliver") {
      console.log(
        JSON.stringify(
          await ciDeliverBuilds(
            root,
            cli.flags.manifest ?? "",
            Boolean(cli.flags.dryRun),
            run
          ),
          null,
          2
        )
      );
      return;
    }
    const result =
      command === "version"
        ? await ciVersionRelease(
            root,
            cli.flags.request ?? "",
            Boolean(cli.flags.dryRun),
            run
          )
        : command === "candidate"
        ? await ciBuildCandidate(
            root,
            cli.flags.request ?? "",
            cli.flags.output ?? "",
            run
          )
        : await ciStageCandidate(
            root,
            cli.flags.manifest ?? "",
            Boolean(cli.flags.dryRun)
          );
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (
    domain !== "npm" ||
    !["plan", "publish", "status"].includes(command ?? "") ||
    extra.length
  )
    throw new CiDevUsageError("Unknown command. Run dev --help.");
  ciAssertCommandFlags(argv, [
    "package",
    "changed",
    "summary",
    "dry-run",
    "preid",
    "tag",
    "access",
    "json",
    "profile",
  ]);
  if (argv.includes("--interactive") || argv.includes("--interactive=true"))
    throw new CiDevUsageError(
      "Interactive prompting is not supported. Supply explicit flags."
    );
  const root = await ciFindWorkspace(cli.flags.workspaceRoot ?? process.cwd());
  if (command === "status") {
    if (
      (cli.flags.package?.length ?? 0) > 1 ||
      cli.flags.changed ||
      cli.flags.summary ||
      cli.flags.dryRun ||
      cli.flags.preid ||
      cli.flags.tag ||
      cli.flags.access
    )
      throw new CiDevUsageError(
        "npm status does not accept release-planning flags."
      );
    const policy = await ciReadPolicy(root);
    if (policy.topology !== "paired" && cli.flags.package?.length)
      throw new CiDevUsageError(
        "npm status does not accept release-planning flags."
      );
    const result = await ciReleaseStatus(
      root,
      subject ?? "",
      (
        await session(root)
      ).run,
      cli.flags.package?.[0]
    );
    console.log(
      cli.flags.json
        ? JSON.stringify(result, null, 2)
        : `${result.status}: ${result.url}\n${result.message}`
    );
    return;
  }
  const options = {
    intent: subject,
    packages: cli.flags.package,
    changed: cli.flags.changed,
    summary: cli.flags.summary,
    preid: cli.flags.preid,
    tag: cli.flags.tag,
    access: cli.flags.access,
  };
  if (command === "plan" || cli.flags.dryRun) {
    const plan = await ciCreateReleasePlan(root, options);
    console.log(
      cli.flags.json ? JSON.stringify(plan, null, 2) : ciFormatPlan(plan)
    );
    return;
  }
  const request = await ciSubmitRelease(
    root,
    options,
    (
      await session(root)
    ).run
  );
  console.log(
    cli.flags.json
      ? JSON.stringify(request, null, 2)
      : `Release request ${
          request.reused ? "recovered" : "submitted"
        }.\n${ciFormatPlan(request.plan)}\n\nStatus: awaiting review\nReview: ${
          request.url
        }\nNo package was published.`
  );
}
