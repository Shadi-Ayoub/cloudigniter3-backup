// Shipped by DEV into each private build repository. Node built-ins only.
import { readFile, writeFile, lstat } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

/** @param {string} root @param {NodeJS.ProcessEnv} [env]
 * @param {(command: string, args: string[]) => string | Promise<string>} [execute]
 */
export async function ciStageBuiltPackage(
  root,
  env = process.env,
  execute = (command, args) =>
    execFileSync(command, args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 120000,
    })
) {
  const policy = JSON.parse(
    await readFile(path.join(root, "release-policy.json"), "utf8")
  );
  const version = env.RELEASE_VERSION ?? "";
  if (
    !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/.test(
      version
    )
  )
    throw new Error("Select an exact reviewed version.");
  if (
    policy.schemaVersion !== 1 ||
    env.GITHUB_ACTIONS !== "true" ||
    env.GITHUB_REPOSITORY !== policy.repository ||
    env.GITHUB_REF !== `refs/heads/${policy.baseBranch}` ||
    !Array.isArray(policy.reviewers) ||
    !policy.reviewers.some(
      (/** @type {unknown} */ name) =>
        typeof name === "string" &&
        name.toLowerCase() === env.GITHUB_ACTOR?.toLowerCase()
    ) ||
    !policy.reviewers.some(
      (/** @type {unknown} */ name) =>
        typeof name === "string" &&
        name.toLowerCase() ===
          (env.GITHUB_TRIGGERING_ACTOR ?? env.GITHUB_ACTOR)?.toLowerCase()
    )
  )
    throw new Error(
      "Only a configured approver may stage from this build repository's protected base branch."
    );
  const directory = path.join(root, "releases", version);
  const manifest = JSON.parse(
    await readFile(path.join(directory, "manifest.json"), "utf8")
  );
  if (
    manifest.schemaVersion !== 1 ||
    manifest.version !== version ||
    manifest.name !== policy.name ||
    manifest.repository !== policy.repository ||
    manifest.sourceRepository !== policy.sourceRepository ||
    manifest.registry !== "https://registry.npmjs.org" ||
    manifest.registry !== policy.registry ||
    manifest.access !== policy.access ||
    !["public", "restricted"].includes(manifest.access) ||
    !Array.isArray(policy.tags) ||
    !policy.tags.includes(manifest.tag) ||
    (version.includes("-") && manifest.tag === "latest") ||
    manifest.archive !== "package.tgz" ||
    !/^[a-f0-9]{64}$/.test(manifest.sha256) ||
    !/^[a-f0-9]{24}$/.test(manifest.request)
  )
    throw new Error(
      "Build manifest conflicts with the reviewed repository policy."
    );
  const archive = path.join(directory, "package.tgz");
  const stat = await lstat(archive);
  const hash = async () =>
    createHash("sha256")
      .update(await readFile(archive))
      .digest("hex");
  if (
    !stat.isFile() ||
    stat.isSymbolicLink() ||
    (await hash()) !== manifest.sha256
  )
    throw new Error("Archive checksum changed.");
  const packed = JSON.parse(
    await execute("tar", ["-xOf", archive, "package/package.json"])
  );
  const repository =
    typeof packed.repository === "string"
      ? packed.repository
      : packed.repository?.url;
  const config = packed.publishConfig ?? {};
  if (
    packed.name !== policy.name ||
    packed.version !== version ||
    packed.private === true ||
    typeof repository !== "string" ||
    repository.replace(/^git\+/, "").replace(/\.git$/, "") !==
      `https://github.com/${policy.repository}` ||
    (config.registry !== undefined && config.registry !== policy.registry) ||
    (config.access !== undefined && config.access !== policy.access) ||
    (config.tag !== undefined && config.tag !== manifest.tag) ||
    config.directory !== undefined
  )
    throw new Error(
      "Packed package metadata conflicts with approved publication settings."
    );
  const npmVersion = String(await execute("npm", ["--version"]))
    .trim()
    .split(".")
    .map(Number);
  if (
    npmVersion.length !== 3 ||
    npmVersion.some((value) => !Number.isInteger(value)) ||
    npmVersion[0] < 11 ||
    (npmVersion[0] === 11 && npmVersion[1] < 15)
  )
    throw new Error("Native staging requires npm >=11.15.0.");
  await execute("npm", [
    "view",
    policy.name,
    "version",
    "--json",
    "--registry",
    policy.registry,
  ]);
  if ((await hash()) !== manifest.sha256)
    throw new Error("Archive changed during staging preflight.");
  const response = await execute("npm", [
    "stage",
    "publish",
    archive,
    "--access",
    policy.access,
    "--tag",
    manifest.tag,
    "--registry",
    policy.registry,
    "--ignore-scripts",
  ]);
  const result = {
    status: "awaiting-npm-approval",
    name: policy.name,
    version,
    sha256: manifest.sha256,
    response,
    published: false,
  };
  await writeFile(
    path.join(root, "staging-result.json"),
    JSON.stringify(result, null, 2) + "\n"
  );
  return result;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    console.log(
      JSON.stringify(await ciStageBuiltPackage(process.cwd()), null, 2)
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
