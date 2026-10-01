import { readFile } from "node:fs/promises";
import path from "node:path";
import { ciReadProfiles, ciProfileSession } from "./github-profiles.mjs";
import { ciReadGithubPolicy, ciAuthorizeRequester } from "./github-policy.mjs";
import { ciReadPolicy, ciIsRecord } from "./policy.mjs";
import { ciRepositoryProject, ciCheckRepository } from "./repositories.mjs";
import { ciGithub, ciStringField } from "./github-api.mjs";
import { ciAssertCommandFlags } from "./maintainer-cli.mjs";
import { ciRun, CiDevUsageError } from "./runtime.mjs";

/** @typedef {{profile?:string, project?:string, repositoryKind?:string, number?:string, runId?:string, title?:string, bodyFile?:string, head?:string, headSha?:string, review?:string, draft?:boolean, interactive?:boolean}} WorkflowFlags */

/** Explicit command catalog: never forward arbitrary gh arguments. */
export const ciGithubCommands = {
  "auth login": ["profile"],
  "auth status": ["profile"],
  "repo view": [],
  "pr list": [],
  "pr view": ["number"],
  "pr diff": ["number"],
  "pr checks": ["number"],
  "pr create": ["head", "title", "body-file", "draft"],
  "pr review": ["number", "head-sha", "review", "body-file"],
  "pr merge": ["number", "head-sha"],
  "issue list": [],
  "issue view": ["number"],
  "run list": [],
  "run view": ["run-id"],
  "workflow list": [],
};

/** @param {string|undefined} value @param {string} flag */
function required(value, flag) {
  if (!value?.trim() || value.startsWith("-") || /[\x00-\x1f]/.test(value))
    throw new CiDevUsageError(`This command requires --${flag}=<value>.`);
  return value;
}

/** @param {string} root @param {string} group @param {string} action
 * @param {WorkflowFlags} flags @param {string[]} argv
 * @param {import('./types.d.mts').Runner} [run]
 */
export async function ciGithubWorkflow(
  root,
  group,
  action,
  flags,
  argv,
  run = ciRun
) {
  const key = `${group} ${action}`;
  const allowed =
    ciGithubCommands[/** @type {keyof typeof ciGithubCommands} */ (key)];
  if (!allowed)
    throw new CiDevUsageError("Unknown GitHub command. Run dev --help.");
  ciAssertCommandFlags(
    argv,
    group === "auth"
      ? allowed
      : [...allowed, "project", "repository-kind", "profile"]
  );
  const selected = flags.profile ?? process.env.CLOUDIGNITER_PROFILE;
  if (group === "auth") {
    if (action === "login") {
      if (!flags.profile)
        throw new CiDevUsageError("GitHub login requires --profile=<name>.");
      if (flags.interactive === false)
        throw new CiDevUsageError(
          "Browser login is interactive; omit --no-interactive."
        );
      const { profiles } = await ciReadProfiles(root);
      const profile = profiles[flags.profile];
      if (!profile)
        throw new CiDevUsageError(
          "Unknown GitHub profile. Run dev github profiles."
        );
      console.log(
        `Sign in as ${profile.username} in the browser. GitHub CLI stores the credential.`
      );
      try {
        await run(
          "gh",
          [
            "auth",
            "login",
            "--hostname",
            "github.com",
            "--web",
            "--git-protocol",
            "https",
          ],
          root,
          {
            interactive: true,
            timeout: 600_000,
            env: {
              GH_TOKEN: undefined,
              GITHUB_TOKEN: undefined,
              GH_ENTERPRISE_TOKEN: undefined,
              GITHUB_ENTERPRISE_TOKEN: undefined,
              GH_HOST: "github.com",
            },
          }
        );
      } catch {
        throw new Error(
          "GitHub browser login did not complete. Retry dev github auth login with the same profile."
        );
      }
      // Check the login just completed, not only an older credential for this profile.
      const current = await ciGithub(
        root,
        async (command, args, cwd, options) =>
          run(command, args, cwd, {
            ...options,
            env: {
              GH_TOKEN: undefined,
              GITHUB_TOKEN: undefined,
              GH_HOST: "github.com",
            },
          })
      )("user");
      if (
        ciStringField(current, "login").toLowerCase() !==
        profile.username.toLowerCase()
      )
        throw new CiDevUsageError(
          `Login used a different account. Repeat login as ${profile.username}.`
        );
    }
    if (!selected)
      return run("gh", ["auth", "status", "--hostname", "github.com"], root);
    const session = await ciProfileSession(root, selected, run);
    return JSON.stringify(
      { status: "authenticated", profile: session.profile },
      null,
      2
    );
  }
  const projectId = required(flags.project, "project");
  const githubPolicy = await ciReadGithubPolicy(root);
  const inventory =
    projectId === "workspace"
      ? null
      : await ciRepositoryProject(root, projectId);
  if (projectId === "workspace" && flags.repositoryKind === "build")
    throw new CiDevUsageError(
      "The workspace has no build repository; select a package or website project."
    );
  const build = flags.repositoryKind === "build";
  const repository = inventory
    ? build
      ? inventory.project.buildRepository
      : inventory.project.sourceRepository
    : githubPolicy.workspaceRepository;
  if (!repository)
    throw new CiDevUsageError(
      "Configure the selected repository first; workspace uses github-policy.workspaceRepository."
    );
  const base = inventory?.baseBranch ?? (await ciReadPolicy(root)).baseBranch;
  const args = [group, action];
  if (
    [
      "pr view",
      "pr diff",
      "pr checks",
      "pr review",
      "pr merge",
      "issue view",
      "run view",
    ].includes(key)
  ) {
    const number = required(
      group === "run" ? flags.runId : flags.number,
      group === "run" ? "run-id" : "number"
    );
    if (!/^[1-9]\d*$/.test(number))
      throw new CiDevUsageError("Use a positive numeric PR, issue or run ID.");
    args.push(number);
  }
  let body;
  if (key === "pr create" || key === "pr review") {
    body = await readFile(
      path.resolve(required(flags.bodyFile, "body-file")),
      "utf8"
    );
    if (!body.trim())
      throw new CiDevUsageError(
        "The body file must contain a description or review."
      );
  }
  if (key === "pr create") {
    const head = required(flags.head, "head");
    if (
      head === base ||
      !/^[a-z0-9][a-z0-9._/-]*$/i.test(head) ||
      /\.\.|\/\/|\.lock(?:\/|$)|[/.]$/.test(head)
    )
      throw new CiDevUsageError(
        "Use a valid pushed feature branch distinct from the base branch."
      );
    args.push(
      "--base",
      base,
      "--head",
      head,
      "--title",
      required(flags.title, "title"),
      "--body-file",
      "-"
    );
    if (flags.draft) args.push("--draft");
  }
  if (key === "pr review" || key === "pr merge") {
    if (!/^[a-f0-9]{40}$/.test(flags.headSha ?? ""))
      throw new CiDevUsageError(
        "Use --head-sha=<40-character-reviewed-commit> from pr view."
      );
    if (
      key === "pr review" &&
      !["approve", "request-changes", "comment"].includes(flags.review ?? "")
    )
      throw new CiDevUsageError(
        "Use --review=approve|request-changes|comment."
      );
  }
  const session = await ciProfileSession(root, selected, run);
  const scoped = session.run;
  await ciCheckRepository(
    root,
    repository,
    !build || inventory?.project.buildVisibility !== "public",
    scoped
  );
  const api = ciGithub(root, scoped);
  if (key === "pr create") {
    const login = ciStringField(await api("user"), "login");
    await ciAuthorizeRequester(root, login);
    const reviewers = (await ciReadPolicy(root)).reviewers.filter(
      (name) => name.toLowerCase() !== login.toLowerCase()
    );
    if (!reviewers.length)
      throw new CiDevUsageError(
        "Configure an independent reviewer before opening a PR."
      );
    for (const reviewer of reviewers) args.push("--reviewer", reviewer);
  }
  if (key === "pr review" || key === "pr merge") {
    const login = ciStringField(await api("user"), "login");
    const policy = await ciReadPolicy(root);
    if (
      !policy.reviewers.some(
        (name) => name.toLowerCase() === login.toLowerCase()
      )
    )
      throw new CiDevUsageError(
        "Use a configured approver account for review or merge."
      );
    const pull = await api(`repos/${repository}/pulls/${flags.number}`);
    if (
      !ciIsRecord(pull) ||
      pull.state !== "open" ||
      pull.draft ||
      !ciIsRecord(pull.head) ||
      pull.head.sha !== flags.headSha ||
      !ciIsRecord(pull.base) ||
      pull.base.ref !== base ||
      !ciIsRecord(pull.user) ||
      String(pull.user.login).toLowerCase() === login.toLowerCase()
    )
      throw new CiDevUsageError(
        "Review requires another author's open PR, the configured base, and the exact reviewed head commit."
      );
    if (key === "pr review") {
      const event = {
        approve: "APPROVE",
        "request-changes": "REQUEST_CHANGES",
        comment: "COMMENT",
      }[/** @type {'approve'|'request-changes'|'comment'} */ (flags.review)];
      return JSON.stringify(
        await api(`repos/${repository}/pulls/${flags.number}/reviews`, {
          commit_id: flags.headSha,
          event,
          body,
        }),
        null,
        2
      );
    }
    args.push("--squash", "--match-head-commit", flags.headSha ?? "");
  }
  if (key === "repo view")
    return scoped("gh", ["repo", "view", repository], root);
  if (key === "pr view")
    args.push(
      "--json",
      "number,title,url,state,author,headRefName,headRefOid,baseRefName,reviewDecision,statusCheckRollup,body"
    );
  args.push("--repo", repository);
  return scoped("gh", args, root, body === undefined ? {} : { input: body });
}
