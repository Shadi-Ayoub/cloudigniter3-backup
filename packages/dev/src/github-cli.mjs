import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { access, chmod, lstat, mkdir, mkdtemp, open, readFile, rename, rm, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import semver from "semver";
import { ciGithubCliRelease } from "./github-cli-release.mjs";

const execute = promisify(execFile);
const maxArchiveBytes = 80 * 1024 * 1024;
const maxBinaryBytes = 128 * 1024 * 1024;

// Distinguish executable setup failures from authentication failures.
export class CiGithubCliSetupError extends Error {}

/** @typedef {{path: string, version: string, source: "system" | "managed", installed: boolean}} GhInstallation */
/** @typedef {{check?: boolean, env?: NodeJS.ProcessEnv, platform?: string, arch?: string, cwd?: string, release?: typeof ciGithubCliRelease, run?: typeof ciExecute, download?: typeof ciDownload}} GhSetupOptions */

/** @param {string} command @param {string[]} args @param {string} cwd @param {NodeJS.ProcessEnv} env */
async function ciExecute(command, args, cwd, env) {
  const result = await execute(command, args, {
    cwd, env, shell: false, encoding: "buffer", timeout: 15_000,
    maxBuffer: maxBinaryBytes, windowsHide: true,
  });
  return result.stdout;
}

/** Exclude package-local shims even when a package manager injected them into PATH.
 * @param {NodeJS.ProcessEnv} env */
function ciToolEnvironment(env) {
  const key = Object.keys(env).find((name) => name.toLowerCase() === "path");
  const directories = (env[key ?? "PATH"] ?? "").split(path.delimiter).filter((directory) =>
    path.isAbsolute(directory) && !/(?:^|[\\/])node_modules(?:[\\/]|$)/i.test(directory)
  );
  const result = { ...env };
  for (const name of Object.keys(result)) if (name.toLowerCase() === "path") delete result[name];
  result.PATH = [...new Set(directories)].join(path.delimiter);
  return result;
}

/** @param {string} name @param {NodeJS.ProcessEnv} env @param {string} platform */
async function ciFindExecutables(name, env, platform) {
  const found = [];
  for (const directory of (env.PATH ?? "").split(path.delimiter).filter(Boolean)) {
    const candidate = path.join(directory, platform === "win32" ? `${name}.exe` : name);
    try { await access(candidate, constants.X_OK); found.push(candidate); } catch { /* Continue PATH lookup. */ }
  }
  return found;
}

/** @param {Buffer} data */
function ciSha256(data) { return createHash("sha256").update(data).digest("hex"); }

/** @param {string} executable @param {string} cwd @param {NodeJS.ProcessEnv} env @param {typeof ciExecute} run */
async function ciVersion(executable, cwd, env, run) {
  try {
    const output = (await run(executable, ["--version"], cwd, env)).toString("utf8");
    const version = output.match(/^gh version (\d+\.\d+\.\d+)(?:\s|$)/)?.[1];
    return version && semver.valid(version) ? version : null;
  } catch { return null; }
}

/** @param {NodeJS.ProcessEnv} env @param {string} platform */
function ciToolsRoot(env, platform) {
  if (env.CLOUDIGNITER_TOOLS_DIR) {
    if (!path.isAbsolute(env.CLOUDIGNITER_TOOLS_DIR))
      throw new Error("CLOUDIGNITER_TOOLS_DIR must be an absolute directory path.");
    return env.CLOUDIGNITER_TOOLS_DIR;
  }
  const base = platform === "darwin" ? path.join(homedir(), "Library", "Caches")
    : platform === "win32" ? (env.LOCALAPPDATA || path.join(homedir(), "AppData", "Local"))
    : (env.XDG_CACHE_HOME || path.join(homedir(), ".cache"));
  if (!path.isAbsolute(base)) throw new Error("The user cache directory must be absolute.");
  return path.join(base, "cloudigniter", "tools");
}

/** @param {string} location */
async function ciStat(location) {
  try { return await lstat(location); } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return null;
    throw error;
  }
}

/** @param {string} directory @param {string} filename @param {{name: string, sha256: string}} asset @param {string} version */
async function ciReadCached(directory, filename, asset, version) {
  const stat = await ciStat(directory);
  if (!stat) return null;
  const invalid = () => new Error(`GitHub CLI cache is invalid at ${directory}. Inspect and remove that version directory, then run dev github setup.`);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw invalid();
  const executable = path.join(directory, filename), receiptPath = path.join(directory, "receipt.json");
  const executableStat = await ciStat(executable), receiptStat = await ciStat(receiptPath);
  if (!executableStat?.isFile() || executableStat.isSymbolicLink() || executableStat.size > maxBinaryBytes ||
      !receiptStat?.isFile() || receiptStat.isSymbolicLink() || receiptStat.size > 4096) throw invalid();
  try {
    const receipt = JSON.parse(await readFile(receiptPath, "utf8"));
    if (receipt.version !== version || receipt.archiveSha256 !== asset.sha256 ||
        receipt.binarySha256 !== ciSha256(await readFile(executable))) throw invalid();
    await access(executable, constants.X_OK);
  } catch { throw invalid(); }
  return executable;
}

/** Fetch only official release hosts, with bounded redirects, time and bytes.
 * @param {string} location */
async function ciDownload(location) {
  const signal = AbortSignal.timeout(60_000);
  const hosts = new Set(["github.com", "release-assets.githubusercontent.com", "objects.githubusercontent.com"]);
  for (let redirects = 0; redirects <= 5; redirects++) {
    const url = new URL(location);
    if (url.protocol !== "https:" || !hosts.has(url.hostname) || url.username || url.password || (url.port && url.port !== "443"))
      throw new Error("GitHub CLI download refused an unexpected release host.");
    const response = await fetch(url, { redirect: "manual", signal, headers: { "User-Agent": "cloudigniter-dev", Accept: "application/octet-stream" } });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      await response.body?.cancel();
      const next = response.headers.get("location");
      if (!next) throw new Error("GitHub CLI release redirect has no location.");
      location = new URL(next, url).href;
      continue;
    }
    if (!response.ok || !response.body) { await response.body?.cancel(); throw new Error(`GitHub CLI download failed (HTTP ${response.status}).`); }
    const reader = response.body.getReader(), chunks = [];
    let size = 0;
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > maxArchiveBytes) throw new Error("GitHub CLI archive exceeds the download limit.");
        chunks.push(Buffer.from(chunk.value));
      }
    } finally { await reader.cancel(); }
    return Buffer.concat(chunks);
  }
  throw new Error("GitHub CLI download exceeded the redirect limit.");
}

/** Reuse a compatible system executable or install one verified private copy.
 * No login, global installation, PATH mutation or workspace discovery occurs.
 * @param {GhSetupOptions} [options]
 * @returns {Promise<GhInstallation>} */
export async function ciSetupGithubCli(options = {}) {
  const { check = false, platform = process.platform, arch = process.arch,
    cwd = process.cwd(), release = ciGithubCliRelease, run = ciExecute, download = ciDownload } = options;
  const env = ciToolEnvironment(options.env ?? process.env);
  for (const executable of await ciFindExecutables("gh", env, platform)) {
    const version = await ciVersion(executable, cwd, env, run);
    if (version && semver.major(version) === semver.major(release.version) && semver.gte(version, release.version))
      return { path: executable, version, source: "system", installed: false };
  }
  const asset = release.assets[`${platform}-${arch}`];
  if (!asset) throw new Error(`No managed GitHub CLI for ${platform}/${arch}. Install gh >=${release.version} <${semver.major(release.version) + 1}.0.0 on PATH.`);
  const root = ciToolsRoot(env, platform);
  const directory = path.join(root, `gh-${release.version}-${platform}-${arch}`);
  const filename = platform === "win32" ? "gh.exe" : "gh";
  const cached = await ciReadCached(directory, filename, asset, release.version);
  if (cached) return { path: cached, version: release.version, source: "managed", installed: false };
  if (check) throw new Error(`GitHub CLI >=${release.version} is unavailable. Run dev github setup to install the managed copy.`);
  const [tar] = await ciFindExecutables("tar", env, platform);
  if (!tar) throw new Error("GitHub CLI setup requires the system tar executable (bsdtar for ZIP archives). Install it, then run dev github setup.");
  await mkdir(root, { recursive: true, mode: 0o700 });
  const rootStat = await lstat(root);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) throw new Error("The DEV tools directory must be a regular directory, not a symlink.");
  const lockPath = `${directory}.lock`;
  let lock;
  try { lock = await open(lockPath, "wx", 0o600); } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "EEXIST")
      throw new Error(`GitHub CLI setup is locked at ${lockPath}. Retry after the other installer finishes; inspect a stale lock before removing it.`);
    throw error;
  }
  let staging;
  try {
    // Another installer may have completed between our first check and taking the lock.
    const ready = await ciReadCached(directory, filename, asset, release.version);
    if (ready) return { path: ready, version: release.version, source: "managed", installed: false };
    const bytes = await download(`https://github.com/cli/cli/releases/download/v${release.version}/${asset.name}`);
    if (bytes.length > maxArchiveBytes || ciSha256(bytes) !== asset.sha256)
      throw new Error("GitHub CLI archive checksum verification failed; no executable was installed.");
    staging = await mkdtemp(path.join(root, ".gh-install-"));
    const archive = path.join(staging, asset.name);
    await writeFile(archive, bytes, { flag: "wx", mode: 0o600 });
    const names = (await run(tar, ["-tf", archive], staging, env)).toString("utf8").split(/\r?\n/);
    const prefix = asset.name.replace(/\.(?:zip|tar\.gz)$/, "");
    const member = names.filter((name) => name === `${prefix}/bin/${filename}` || name === `bin/${filename}`);
    const license = names.filter((name) => name === `${prefix}/LICENSE` || name === "LICENSE");
    if (member.length !== 1 || license.length !== 1) throw new Error("GitHub CLI archive has an unexpected executable or license layout.");
    // Extract to buffers, never to archive-selected filesystem paths.
    const binary = await run(tar, ["-xOf", archive, member[0]], staging, env);
    const licenseBytes = await run(tar, ["-xOf", archive, license[0]], staging, env);
    const executable = path.join(staging, filename);
    await writeFile(executable, binary, { flag: "wx", mode: 0o700 });
    await chmod(executable, 0o700);
    if (await ciVersion(executable, staging, env, run) !== release.version)
      throw new Error("Downloaded GitHub CLI did not report its pinned version.");
    await writeFile(path.join(staging, "LICENSE"), licenseBytes, { flag: "wx", mode: 0o600 });
    await writeFile(path.join(staging, "receipt.json"), JSON.stringify({
      version: release.version, archiveSha256: asset.sha256, binarySha256: ciSha256(binary),
    }) + "\n", { flag: "wx", mode: 0o600 });
    await unlink(archive);
    await rename(staging, directory);
    staging = undefined;
    return { path: path.join(directory, filename), version: release.version, source: "managed", installed: true };
  } finally {
    try {
      if (staging) await rm(staging, { recursive: true, force: true });
    } finally {
      const identity = await lock.stat();
      await lock.close();
      const current = await ciStat(lockPath);
      if (current && current.ino === identity.ino && current.dev === identity.dev && !current.isSymbolicLink()) await unlink(lockPath);
    }
  }
}

/** Resolve without network or installation during ordinary GitHub operations.
 * @param {NodeJS.ProcessEnv} [env] @param {string} [cwd] */
export async function ciResolveGithubCli(env = process.env, cwd = process.cwd()) {
  try {
    return (await ciSetupGithubCli({ check: true, env, cwd })).path;
  } catch (error) {
    throw new CiGithubCliSetupError(error instanceof Error ? error.message : "GitHub CLI unavailable. Run dev github setup.");
  }
}
