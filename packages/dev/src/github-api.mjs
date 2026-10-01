import { realpath } from "node:fs/promises";
import { ciIsRecord } from "./policy.mjs";
import { CiDevUsageError } from "./runtime.mjs";

/** @param {unknown} value @param {string} field */
export function ciStringField(value, field) {
  if (!ciIsRecord(value) || typeof value[field] !== "string")
    throw new Error(`Unexpected GitHub response: missing ${field}.`);
  return value[field];
}

/** @param {unknown} value */
export function ciSha(value) {
  const sha = ciStringField(value, "sha");
  if (!/^[a-f0-9]{40}$/.test(sha))
    throw new Error("Unexpected GitHub commit identifier.");
  return sha;
}

/** @param {unknown} value @param {string} repository */
export function ciPullUrl(value, repository) {
  const url = ciStringField(value, "html_url");
  const prefix = `https://github.com/${repository}/pull/`;
  if (
    !url.startsWith(prefix) ||
    !/^[1-9][0-9]*$/.test(url.slice(prefix.length))
  )
    throw new Error("Unexpected pull request URL.");
  return url;
}

/** @param {string} root @param {import('./types.d.mts').Runner} run */
export function ciGithub(root, run) {
  /** @param {string} endpoint @param {unknown} [body] @param {string} [method] @returns {Promise<unknown>} */
  return async (endpoint, body, method) => {
    const args = [
      "api",
      "--hostname",
      "github.com",
      "--method",
      method ?? (body === undefined ? "GET" : "POST"),
      endpoint,
    ];
    if (body !== undefined) args.push("--input", "-");
    const output = await run(
      "gh",
      args,
      root,
      body === undefined ? {} : { input: JSON.stringify(body) },
    );
    return JSON.parse(output);
  };
}

/** @param {string} root @param {string} branch @param {import('./types.d.mts').Runner} run */
export async function ciCleanBase(root, branch, run) {
  const gitRoot = (
    await run("git", ["rev-parse", "--show-toplevel"], root)
  ).trim();
  if ((await realpath(gitRoot)) !== (await realpath(root)))
    throw new CiDevUsageError(
      "The CloudIgniter workspace must be the Git repository root.",
    );
  if ((await run("git", ["branch", "--show-current"], root)).trim() !== branch)
    throw new CiDevUsageError(
      `Release requests must start on ${branch}, after code review and merge.`,
    );
  if (
    (
      await run(
        "git",
        ["status", "--porcelain=v1", "--untracked-files=all"],
        root,
      )
    ).trim()
  )
    throw new CiDevUsageError(
      "Release submission requires a clean working tree, including untracked files. Use --dry-run for a local preview.",
    );
  const sha = (await run("git", ["rev-parse", "HEAD"], root)).trim();
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error("Invalid local Git commit.");
  return sha;
}
