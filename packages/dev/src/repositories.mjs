import path from "node:path";
import { lstat, realpath } from "node:fs/promises";
import { ciReadJson, ciIsRecord } from "./policy.mjs";
import { CiDevUsageError, ciRun } from "./runtime.mjs";
import { ciGithub } from "./github-api.mjs";

/** @typedef {{type: 'package'|'website'|'template', package?: string, sourcePath: string|null, sourceRepository: string|null, buildRepository: string, buildVisibility: 'public'|'private', delivery: 'npm'|'aws'|'github'}} CiRepositoryProject */

/** @param {string} root */
export async function ciReadRepositories(root) {
  let raw;
  try {
    raw = await ciReadJson(path.join(root, ".cloudigniter/repositories.json"));
  } catch {
    throw new CiDevUsageError(
      "Configure .cloudigniter/repositories.json before using company repository commands."
    );
  }
  if (
    !ciIsRecord(raw) ||
    raw.schemaVersion !== 1 ||
    !ciIsRecord(raw.projects) ||
    Object.keys(raw).some(
      (key) => !["schemaVersion", "baseBranch", "projects"].includes(key)
    ) ||
    typeof raw.baseBranch !== "string" ||
    !/^[a-z0-9][a-z0-9._/-]*$/i.test(raw.baseBranch) ||
    /\.\.|\/\/|\.lock(?:\/|$)|[/.]$/.test(raw.baseBranch)
  )
    throw new CiDevUsageError("Invalid company repository configuration.");
  /** @type {Record<string, CiRepositoryProject>} */
  const projects = {};
  const repositories = new Set();
  const packages = new Set();
  for (const [id, item] of Object.entries(raw.projects)) {
    if (
      !/^[a-z][a-z0-9-]*$/.test(id) ||
      !ciIsRecord(item) ||
      Object.keys(item).some(
        (key) =>
          ![
            "type",
            "package",
            "sourcePath",
            "sourceRepository",
            "buildRepository",
            "buildVisibility",
            "delivery",
          ].includes(key)
      ) ||
      !["package", "website", "template"].includes(String(item.type))
    )
      throw new CiDevUsageError(
        "Invalid project entry; credentials do not belong in repository configuration."
      );
    for (const field of ["sourceRepository", "buildRepository"]) {
      const repository = item[field];
      if (field === "sourceRepository" && repository === null) continue;
      if (
        typeof repository !== "string" ||
        !/^[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9._-]*$/i.test(repository) ||
        repositories.has(repository.toLowerCase())
      )
        throw new CiDevUsageError(
          "Every source and build repository must have a distinct owner/name; one repository cannot be both private source and public export."
        );
      repositories.add(repository.toLowerCase());
    }
    if (
      item.sourcePath !== null &&
      (typeof item.sourcePath !== "string" ||
        item.sourcePath.includes("\\") ||
        item.sourcePath
          .split("/")
          .some(
            (part) =>
              !part ||
              part === "." ||
              part === ".." ||
              part.startsWith(".") ||
              /[\x00-\x1f]/.test(part)
          ))
    )
      throw new CiDevUsageError(
        "sourcePath must be a confined workspace-relative path or null."
      );
    if (item.type === "package") {
      if (
        typeof item.package !== "string" ||
        !/^@cloudigniter\/[a-z0-9][a-z0-9-]*$/.test(item.package) ||
        packages.has(item.package) ||
        item.delivery !== "npm" ||
        item.buildVisibility !== "private"
      )
        throw new CiDevUsageError(
          "Package projects require a unique npm package, private build repository and npm delivery."
        );
      packages.add(item.package);
    } else if (
      item.package !== undefined ||
      (item.type === "website" &&
        (item.delivery !== "aws" || item.buildVisibility !== "private")) ||
      (item.type === "template" &&
        (item.delivery !== "github" || item.buildVisibility !== "public"))
    )
      throw new CiDevUsageError(
        "Website and template delivery/visibility settings are inconsistent."
      );
    // Values above are validated together; construct the discriminants explicitly.
    projects[id] = {
      type:
        item.type === "package"
          ? "package"
          : item.type === "website"
          ? "website"
          : "template",
      ...(typeof item.package === "string" ? { package: item.package } : {}),
      sourcePath: typeof item.sourcePath === "string" ? item.sourcePath : null,
      sourceRepository:
        typeof item.sourceRepository === "string"
          ? item.sourceRepository
          : null,
      buildRepository: String(item.buildRepository),
      buildVisibility: item.buildVisibility === "public" ? "public" : "private",
      delivery:
        item.delivery === "npm"
          ? "npm"
          : item.delivery === "aws"
          ? "aws"
          : "github",
    };
  }
  return { schemaVersion: 1, baseBranch: raw.baseBranch, projects };
}

/** @param {string} root @param {string} id */
export async function ciRepositoryProject(root, id) {
  const policy = await ciReadRepositories(root);
  const project =
    policy.projects[id] ??
    Object.values(policy.projects).find((entry) => entry.package === id);
  if (!project)
    throw new CiDevUsageError(
      `Unknown company project: ${id}. Run dev github repositories.`
    );
  return { ...policy, project };
}

/** @param {string} root @param {string} repository @param {boolean} isPrivate @param {import('./types.d.mts').Runner} run */
export async function ciCheckRepository(root, repository, isPrivate, run) {
  const value = await ciGithub(root, run)(`repos/${repository}`);
  if (
    !ciIsRecord(value) ||
    value.full_name !== repository ||
    value.private !== isPrivate ||
    value.archived !== false
  )
    throw new CiDevUsageError(
      "Repository identity, visibility or archive state differs from company policy."
    );
  return value;
}

/** Explicit profile credentials reach git through gh's helper, never URLs or argv. */
const gitAuth = [
  "-c",
  "credential.helper=",
  "-c",
  "credential.helper=!gh auth git-credential",
  "-c",
  "credential.useHttpPath=true",
];

/** @param {string} root @param {'clone'|'pull'} action @param {string} id
 * @param {{output?:string, repositoryKind?:string, dryRun?:boolean}} options
 * @param {import('./types.d.mts').Runner} [run]
 */
export async function ciRepositoryCheckout(
  root,
  action,
  id,
  options,
  run = ciRun
) {
  const { project, baseBranch } = await ciRepositoryProject(root, id);
  const kind = options.repositoryKind ?? "source";
  if (kind !== "source" && kind !== "build")
    throw new CiDevUsageError("--repository-kind must be source or build.");
  const repository =
    kind === "source" ? project.sourceRepository : project.buildRepository;
  if (!repository)
    throw new CiDevUsageError(
      "Select a distinct private source repository for this project first."
    );
  if (!options.output?.trim())
    throw new CiDevUsageError(
      "Repository clone/pull requires --output=<checkout-directory>."
    );
  const output = path.join(
    await realpath(path.dirname(path.resolve(options.output))),
    path.basename(path.resolve(options.output))
  );
  const workspace = await realpath(root);
  if (
    output === workspace ||
    output.startsWith(workspace + path.sep) ||
    workspace.startsWith(output + path.sep)
  )
    throw new CiDevUsageError(
      "Use a separate checkout outside the integration workspace."
    );
  let exists = false;
  try {
    const stat = await lstat(output);
    exists = true;
    if (!stat.isDirectory() || stat.isSymbolicLink())
      throw new CiDevUsageError(
        "Checkout output must be a regular directory, never a symlink."
      );
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !("code" in error) ||
      error.code !== "ENOENT"
    )
      throw error;
  }
  if (action === "clone" && exists)
    throw new CiDevUsageError(
      "Clone output already exists; use github pull for an existing checkout."
    );
  if (action === "pull" && !exists)
    throw new CiDevUsageError("Checkout is missing; use github clone first.");
  const url = `https://github.com/${repository}.git`;
  if (action === "pull") {
    if (
      (await realpath(
        (await run("git", ["rev-parse", "--show-toplevel"], output)).trim()
      )) !== output ||
      (await run("git", ["remote", "get-url", "origin"], output)).trim() !==
        url ||
      (await run("git", ["branch", "--show-current"], output)).trim() !==
        baseBranch ||
      (
        await run(
          "git",
          ["status", "--porcelain=v1", "--untracked-files=all"],
          output
        )
      ).trim()
    )
      throw new CiDevUsageError(
        "Pull requires the clean configured base branch and the exact company origin URL."
      );
  }
  const preview = { action, repository, kind, output, baseBranch };
  if (options.dryRun) return { ...preview, status: "preview" };
  await ciCheckRepository(
    root,
    repository,
    kind === "source" || project.buildVisibility === "private",
    run
  );
  if (action === "clone")
    await run(
      "git",
      [
        ...gitAuth,
        "clone",
        "--branch",
        baseBranch,
        "--single-branch",
        "--",
        url,
        output,
      ],
      root
    );
  else {
    await run(
      "git",
      [...gitAuth, "fetch", "--no-tags", "origin", `refs/heads/${baseBranch}`],
      output
    );
    await run("git", ["merge", "--ff-only", "FETCH_HEAD"], output);
  }
  return { ...preview, status: action === "clone" ? "cloned" : "updated" };
}
