import path from "node:path";
import { ciReadJson, ciIsRecord } from "./policy.mjs";
import { ciGithub } from "./github-api.mjs";
import { ciRun, CiDevUsageError } from "./runtime.mjs";
import { CiGithubCliSetupError } from "./github-cli.mjs";

/** @param {string} root */
export async function ciReadProfiles(root) {
  let raw;
  try {
    raw = await ciReadJson(
      path.join(root, ".cloudigniter/github-profiles.json")
    );
  } catch {
    throw new CiDevUsageError(
      "Configure .cloudigniter/github-profiles.json with profile names, GitHub usernames and roles; never credentials."
    );
  }
  if (
    !ciIsRecord(raw) ||
    raw.schemaVersion !== 1 ||
    !ciIsRecord(raw.profiles) ||
    Object.keys(raw).some((key) => !["schemaVersion", "profiles"].includes(key))
  )
    throw new CiDevUsageError("Invalid GitHub profiles configuration.");
  /** @type {Record<string, {username: string, role: 'developer' | 'approver'}>} */
  const profiles = {};
  for (const [name, entry] of Object.entries(raw.profiles)) {
    if (
      !/^[a-z][a-z0-9-]*$/.test(name) ||
      !ciIsRecord(entry) ||
      Object.keys(entry).some((key) => !["username", "role"].includes(key)) ||
      typeof entry.username !== "string" ||
      !/^[a-z0-9][a-z0-9-]*$/i.test(entry.username) ||
      (entry.role !== "developer" && entry.role !== "approver")
    )
      throw new CiDevUsageError(
        "Profiles accept a GitHub username and developer/approver role only. Store credentials in GitHub CLI's credential store."
      );
    profiles[name] = { username: entry.username, role: entry.role };
  }
  if (!Object.keys(profiles).length)
    throw new CiDevUsageError("Configure at least one GitHub profile.");
  return { schemaVersion: 1, profiles };
}

/** Pin credentials to this invocation; never change gh's shared active account.
 * @param {string} root @param {string | undefined} selected
 * @param {import('./types.d.mts').Runner} [run]
 */
export async function ciProfileSession(root, selected, run = ciRun) {
  if (!selected) return { run, profile: null };
  const { profiles } = await ciReadProfiles(root);
  const profile = profiles[selected];
  if (!profile)
    throw new CiDevUsageError(
      `Unknown GitHub profile: ${selected}. Run dev github profiles.`
    );
  const cleared = {
    GH_TOKEN: undefined,
    GITHUB_TOKEN: undefined,
    GH_ENTERPRISE_TOKEN: undefined,
    GITHUB_ENTERPRISE_TOKEN: undefined,
    GH_HOST: "github.com",
  };
  let token;
  try {
    token = (
      await run(
        "gh",
        [
          "auth",
          "token",
          "--hostname",
          "github.com",
          "--user",
          profile.username,
        ],
        root,
        { env: cleared }
      )
    ).trim();
  } catch (error) {
    if (error instanceof CiGithubCliSetupError) throw error;
    throw new CiDevUsageError(
      `No stored GitHub credential for profile ${selected}. Authenticate ${profile.username} using dev github auth login --profile=${selected}.`
    );
  }
  if (!token || /\s/.test(token))
    throw new CiDevUsageError(
      "The selected profile has no usable stored GitHub credential."
    );
  /** @type {import('./types.d.mts').Runner} */
  const scoped = async (command, args, cwd, options = {}) => {
    if (command !== "gh" && command !== "git")
      return run(command, args, cwd, options);
    try {
      return await run(command, args, cwd, {
        ...options,
        env: { ...options.env, ...cleared, GH_TOKEN: token },
      });
    } catch (error) {
      // Never attach the original process error: verbose output can expose child options.
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(message.split(token).join("[REDACTED]"));
    }
  };
  const identity = await ciGithub(root, scoped)("user");
  if (
    !ciIsRecord(identity) ||
    identity.type !== "User" ||
    typeof identity.login !== "string" ||
    identity.login.toLowerCase() !== profile.username.toLowerCase()
  )
    throw new CiDevUsageError(
      "The selected profile credential does not belong to the configured GitHub user."
    );
  return { run: scoped, profile: { name: selected, ...profile } };
}
