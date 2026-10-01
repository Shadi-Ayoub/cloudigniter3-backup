import path from "node:path";
import { ciReadJson, ciIsRecord } from "./policy.mjs";
import { CiDevUsageError } from "./runtime.mjs";

const policyPath = ".cloudigniter/github-policy.json";
const repositoryPattern =
  /^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9][A-Za-z0-9._-]*$/;

/** @param {unknown} raw @param {string[]} keys */
function exactFields(raw, keys) {
  if (!ciIsRecord(raw) || Object.keys(raw).some((key) => !keys.includes(key)))
    throw new CiDevUsageError(
      `${policyPath}: invalid fields. Store repository settings here, never credentials.`
    );
  return raw;
}

/** @param {unknown} raw @param {boolean} [teams] @returns {string[]} */
function identities(raw, teams = false) {
  const pattern = teams
    ? /^[A-Za-z0-9][A-Za-z0-9-]*(?:\/[A-Za-z0-9][A-Za-z0-9-]*)?$/
    : /^[A-Za-z0-9][A-Za-z0-9-]*$/;
  if (
    !Array.isArray(raw) ||
    raw.some((value) => typeof value !== "string" || !pattern.test(value))
  )
    throw new CiDevUsageError(
      `${policyPath}: use GitHub usernames${
        teams ? " or organization/team slugs" : ""
      }, not email addresses.`
    );
  return [...new Set(raw)];
}

/** @param {unknown} value */
function repository(value) {
  if (value === null) return null;
  if (typeof value !== "string" || !repositoryPattern.test(value))
    throw new CiDevUsageError(
      `${policyPath}: repository must be owner/name or null.`
    );
  return value;
}

/** @param {string} root */
export async function ciReadGithubPolicy(root) {
  const raw = exactFields(await ciReadJson(path.join(root, policyPath)), [
    "schemaVersion",
    "backupRepository",
    "workspaceRepository",
    "requesters",
    "template",
  ]);
  if (raw.schemaVersion !== 1)
    throw new CiDevUsageError("Unsupported GitHub policy schema.");
  const template = exactFields(raw.template, [
    "repository",
    "baseBranch",
    "reviewers",
    "requestRepository",
  ]);
  if (
    typeof template.baseBranch !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(template.baseBranch) ||
    /\.\.|\/\/|\.lock(?:\/|$)|[/.]$/.test(template.baseBranch)
  )
    throw new CiDevUsageError(
      "template.baseBranch must be a valid branch name."
    );
  const result = {
    schemaVersion: 1,
    backupRepository: repository(raw.backupRepository),
    workspaceRepository: repository(raw.workspaceRepository ?? null),
    requesters: identities(raw.requesters),
    template: {
      repository: repository(template.repository),
      baseBranch: template.baseBranch,
      reviewers: identities(template.reviewers, true),
      ...(template.requestRepository !== undefined
        ? { requestRepository: repository(template.requestRepository) }
        : {}),
    },
  };
  if (
    result.template.repository &&
    result.template.repository.toLowerCase() ===
      result.backupRepository?.toLowerCase()
  )
    throw new CiDevUsageError(
      "The public template repository must differ from the backup repository."
    );
  return result;
}

/** Local policy is a guardrail; GitHub permissions enforce authorization.
 * @param {string} root @param {string} login
 */
export async function ciAuthorizeRequester(root, login) {
  const policy = await ciReadGithubPolicy(root);
  if (
    !policy.requesters.some(
      (name) => name.toLowerCase() === login.toLowerCase()
    )
  )
    throw new CiDevUsageError(
      `GitHub account ${login} is not a configured requester. Select --profile=developer, or review github-policy.json.`
    );
  return policy;
}
