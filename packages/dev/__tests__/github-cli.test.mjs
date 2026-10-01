import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, access, mkdir, readFile, readdir, writeFile, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ciSetupGithubCli } from "../src/github-cli.mjs";
import { ciGithubCliRelease } from "../src/github-cli-release.mjs";
import { ciRun } from "../src/runtime.mjs";

const bin = fileURLToPath(new URL("../bin/dev.mjs", import.meta.url));
const hook = fileURLToPath(new URL("../bin/setup-github.mjs", import.meta.url));
const version = ciGithubCliRelease.version;
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), "ci-gh-setup-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const cache = path.join(root, "cache");
  const commands = path.join(root, "commands");
  await mkdir(commands);
  return { root, cache, commands, env: { ...process.env, PATH: commands, CLOUDIGNITER_TOOLS_DIR: cache } };
}

function cli(f, args, entry = bin, overrides = {}) {
  return spawnSync(process.execPath, [entry, ...args], {
    cwd: f.root, encoding: "utf8", env: { ...f.env, ...overrides },
  });
}

async function executable(directory, name, content = "fixture") {
  const location = path.join(directory, name);
  await writeFile(location, content, { mode: 0o700 });
  return location;
}

// Use the real archive reader and subprocess runner; only the release download is local.
async function archiveFixture(t) {
  const f = await fixture(t);
  for (const command of ["tar", "gzip"]) await symlink(`/usr/bin/${command}`, path.join(f.commands, command));
  const source = path.join(f.root, "source");
  await mkdir(path.join(source, "bin"), { recursive: true });
  await executable(path.join(source, "bin"), "gh", `#!/bin/sh\nprintf 'gh version ${version} (fixture)\\n'\n`);
  await writeFile(path.join(source, "LICENSE"), "Fixture license\n");
  const archive = path.join(f.root, "fixture.tar.gz");
  const packed = spawnSync("/usr/bin/tar", ["-czf", archive, "bin/gh", "LICENSE"], { cwd: source, encoding: "utf8" });
  assert.equal(packed.status, 0, packed.stderr);
  const bytes = await readFile(archive);
  const release = { version, assets: { [`${process.platform}-${process.arch}`]: { name: "fixture.tar.gz", sha256: hash(bytes) } } };
  return { ...f, bytes, release, options: { env: f.env, cwd: f.root, release, download: async () => bytes } };
}
const posix = { skip: process.platform === "win32" ? "Real tar/shell fixture runs on macOS and Linux" : false };

test("GitHub setup check works before workspace setup and never creates a cache", async (t) => {
  const f = await fixture(t);
  const result = cli(f, ["github", "setup", "--check", "--json"]);
  assert.equal(result.status, 1, result.stderr);
  assert.match(JSON.parse(result.stderr).error, /GitHub CLI.*dev github setup/);
  await assert.rejects(access(f.cache), { code: "ENOENT" });
});

test("setup rejects unrelated flags and extra operands before installation", async (t) => {
  const f = await fixture(t);
  for (const args of [["unexpected"], ["--profile=developer"], ["--output=/tmp"], ["--dry-run"]]) {
    const result = cli(f, ["github", "setup", ...args]);
    assert.equal(result.status, 2, result.stderr);
  }
  await assert.rejects(access(f.cache), { code: "ENOENT" });
});

test("compatible installed gh is reused, including on an unsupported managed platform", async (t) => {
  const f = await fixture(t);
  const installed = await executable(f.commands, "gh");
  const run = async (command, args) => {
    assert.equal(command, installed);
    assert.deepEqual(args, ["--version"]);
    return Buffer.from(`gh version ${version} (fixture)\n`);
  };
  const result = await ciSetupGithubCli({ env: f.env, platform: "freebsd", run, download: () => assert.fail("must not download") });
  assert.deepEqual(result, { path: installed, version, source: "system", installed: false });
  await assert.rejects(access(f.cache), { code: "ENOENT" });
});

test("incompatible and prerelease versions are not selected", async (t) => {
  const f = await fixture(t);
  await executable(f.commands, "gh");
  for (const reported of ["2.1.0", "3.0.0", `${version}-rc.1`, "invalid"]) {
    await assert.rejects(ciSetupGithubCli({ env: f.env, check: true, run: async () => Buffer.from(`gh version ${reported}\n`) }), /unavailable/);
  }
});

test("package-local and relative PATH shims cannot replace GitHub CLI", async (t) => {
  const f = await fixture(t);
  const local = path.join(f.root, "node_modules", ".bin");
  await mkdir(local, { recursive: true });
  await executable(local, "gh");
  await assert.rejects(ciSetupGithubCli({ env: { ...f.env, PATH: [local, "."].join(path.delimiter) }, check: true, run: () => assert.fail("must not run shims") }), /unavailable/);
});

test("managed installation verifies, activates, reuses offline and rejects a changed binary", posix, async (t) => {
  const f = await archiveFixture(t);
  const old = await executable(f.commands, "gh", "#!/bin/sh\nprintf 'gh version 2.1.0\\n'\n");
  const result = await ciSetupGithubCli(f.options);
  assert.equal(result.source, "managed");
  assert.equal(result.installed, true);
  assert.equal(await readFile(old, "utf8"), "#!/bin/sh\nprintf 'gh version 2.1.0\\n'\n");
  assert.equal(await readFile(path.join(path.dirname(result.path), "LICENSE"), "utf8"), "Fixture license\n");
  assert.deepEqual(await readdir(f.cache), [path.basename(path.dirname(result.path))]);
  assert.deepEqual(await ciSetupGithubCli({ ...f.options, download: () => assert.fail("cache must be offline") }), { ...result, installed: false });
  await writeFile(result.path, "tampered");
  await assert.rejects(ciSetupGithubCli(f.options), /cache is invalid/);
  assert.equal(await readFile(result.path, "utf8"), "tampered");
});

test("checksum failure cannot extract or activate and removes only its own lock", posix, async (t) => {
  const f = await archiveFixture(t);
  await mkdir(f.cache);
  await writeFile(path.join(f.cache, "unrelated"), "keep");
  await assert.rejects(ciSetupGithubCli({ ...f.options, download: async () => Buffer.from("wrong bytes"), run: () => assert.fail("must not extract unverified bytes") }), /checksum/);
  assert.deepEqual(await readdir(f.cache), ["unrelated"]);
});

test("failed download, extraction or version verification leaves no installed version", posix, async (t) => {
  const f = await archiveFixture(t);
  await assert.rejects(ciSetupGithubCli({ ...f.options, download: async () => { throw new Error("offline"); } }), /offline/);
  assert.deepEqual(await readdir(f.cache), []);
  await assert.rejects(ciSetupGithubCli({ ...f.options, run: async () => { throw new Error("bad archive"); } }), /bad archive/);
  assert.deepEqual(await readdir(f.cache), []);
  const run = async (_cmd, args) => Buffer.from(args[0] === "-tf" ? "bin/gh\nLICENSE\n" : "wrong version");
  await assert.rejects(ciSetupGithubCli({ ...f.options, run }), /pinned version/);
  assert.deepEqual(await readdir(f.cache), []);
});

test("another installer lock is preserved and prevents download", posix, async (t) => {
  const f = await archiveFixture(t);
  await mkdir(f.cache);
  const lock = `gh-${version}-${process.platform}-${process.arch}.lock`;
  await writeFile(path.join(f.cache, lock), "another installer");
  await assert.rejects(ciSetupGithubCli({ ...f.options, download: () => assert.fail("lock must prevent download") }), /locked/);
  assert.deepEqual(await readdir(f.cache), [lock]);
});

test("unsupported managed platforms and missing tar give actionable errors without writes", async (t) => {
  const f = await fixture(t);
  await assert.rejects(ciSetupGithubCli({ env: f.env, platform: "freebsd" }), /No managed GitHub CLI.*Install/);
  await assert.rejects(ciSetupGithubCli({ env: f.env }), /system tar/);
  await assert.rejects(access(f.cache), { code: "ENOENT" });
});

test("official downloader refuses non-GitHub redirects without forwarding credentials", posix, async (t) => {
  const f = await archiveFixture(t);
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url.hostname, "github.com");
    assert.equal(options.headers.Authorization, undefined);
    return new Response(null, { status: 302, headers: { location: "https://example.com/gh" } });
  });
  await assert.rejects(ciSetupGithubCli({ ...f.options, download: undefined }), /unexpected release host/);
  assert.deepEqual(await readdir(f.cache), []);
});

test("runtime executes the resolved gh with the caller's arguments and profile environment", posix, async (t) => {
  const f = await fixture(t);
  await executable(f.commands, "gh", `#!/bin/sh\nif [ "$1" = '--version' ]; then\n printf 'gh version ${version}\\n'\nelse\n printf '%s\\n' "$GH_TOKEN" "$GH_PROMPT_DISABLED" "$1" "$2"\nfi\n`);
  const output = await ciRun("gh", ["api", "path with spaces"], f.root, { env: { ...f.env, GH_TOKEN: "fixture-token" } });
  assert.equal(output, "fixture-token\n1\napi\npath with spaces");
  await assert.rejects(access(f.cache), { code: "ENOENT" });
});

test("install hook can be skipped and failure does not block package maintenance", async (t) => {
  const f = await fixture(t);
  const skipped = cli(f, [], hook, { CLOUDIGNITER_SKIP_GH_INSTALL: "1" });
  assert.equal(skipped.status, 0, skipped.stderr);
  assert.equal(skipped.stdout + skipped.stderr, "");
  const failure = cli(f, [], hook);
  assert.equal(failure.status, 0);
  assert.match(failure.stderr, /Retry with dev github setup/);
  await assert.rejects(access(f.cache), { code: "ENOENT" });
});
