import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { fixture } from "./fixtures.mjs";
import { ciReadProfiles, ciProfileSession } from "../src/github-profiles.mjs";
import {
  ciReadRepositories,
  ciRepositoryCheckout,
} from "../src/repositories.mjs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { ciRun } from "../src/runtime.mjs";
import path from "node:path";

const bin = fileURLToPath(new URL("../bin/dev.mjs", import.meta.url));

test("configured profiles can be inspected offline without credentials", async (t) => {
  const { root, json } = await fixture(t);
  await json(".cloudigniter/github-profiles.json", {
    schemaVersion: 1,
    profiles: {
      developer: { username: "Shadi-Ayoub", role: "developer" },
      approver: { username: "jodaris", role: "approver" },
    },
  });
  const result = spawnSync(
    process.execPath,
    [bin, "github", "profiles", "--json"],
    { cwd: root, encoding: "utf8" }
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).profiles.approver.username, "jodaris");
});

test("profiles pin concurrent credentials without switching shared login or exposing tokens", async (t) => {
  const { root, json } = await fixture(t);
  await json(".cloudigniter/github-profiles.json", {
    schemaVersion: 1,
    profiles: {
      developer: { username: "alice", role: "developer" },
      approver: { username: "bob", role: "approver" },
    },
  });
  const calls = [];
  const run = async (command, args, cwd, options = {}) => {
    calls.push({ command, args, options });
    assert.ok(!args.includes("switch"));
    if (args[0] === "auth") {
      assert.equal(options.env.GH_TOKEN, undefined);
      return `credential-${args.at(-1)}`;
    }
    const user = options.env.GH_TOKEN.replace("credential-", "");
    if (args[5] === "user")
      return JSON.stringify({ login: user, type: "User" });
    if (args[0] === "fail")
      throw new Error(`Failure with ${options.env.GH_TOKEN}`);
    return user;
  };
  const [developer, approver] = await Promise.all([
    ciProfileSession(root, "developer", run),
    ciProfileSession(root, "approver", run),
  ]);
  assert.deepEqual(
    await Promise.all([
      developer.run("gh", ["probe"], root),
      approver.run("gh", ["probe"], root),
    ]),
    ["alice", "bob"]
  );
  await assert.rejects(
    developer.run("gh", ["fail"], root),
    (error) =>
      error.message.includes("[REDACTED]") &&
      !error.message.includes("credential-alice") &&
      error.cause === undefined
  );
  assert.ok(
    calls.every((call) => !JSON.stringify(call.args).includes("credential-"))
  );
});

test("profiles reject credential fields, unknown names and mismatched API identities", async (t) => {
  const { root, json } = await fixture(t);
  await json(".cloudigniter/github-profiles.json", {
    schemaVersion: 1,
    profiles: {
      developer: {
        username: "alice",
        role: "developer",
        token: "do-not-print",
      },
    },
  });
  await assert.rejects(
    ciReadProfiles(root),
    (error) => !error.message.includes("do-not-print")
  );
  await json(".cloudigniter/github-profiles.json", {
    schemaVersion: 1,
    profiles: { developer: { username: "alice", role: "developer" } },
  });
  await assert.rejects(
    ciProfileSession(root, "missing", async () => {
      throw new Error("must not run");
    }),
    /Unknown/
  );
  await assert.rejects(
    ciProfileSession(root, "developer", async (_, args) =>
      args[0] === "auth"
        ? "secret"
        : JSON.stringify({ login: "bob", type: "User" })
    ),
    /does not belong/
  );
});

test("repository registry refuses private/public collisions and clone previews are offline", async (t) => {
  const { root, json } = await fixture(t);
  const policy = {
    schemaVersion: 1,
    baseBranch: "main",
    projects: {
      core: {
        type: "package",
        package: "@cloudigniter/core",
        sourcePath: "packages/core",
        sourceRepository: "company/core",
        buildRepository: "company/build-core",
        buildVisibility: "private",
        delivery: "npm",
      },
    },
  };
  await json(".cloudigniter/repositories.json", policy);
  const output = root + "-checkout";
  const preview = await ciRepositoryCheckout(
    root,
    "clone",
    "core",
    { output, dryRun: true },
    async () => {
      throw new Error("must stay offline");
    }
  );
  assert.equal(preview.repository, "company/core");
  assert.equal(preview.status, "preview");
  policy.projects.core.buildRepository = "COMPANY/core";
  await json(".cloudigniter/repositories.json", policy);
  await assert.rejects(ciReadRepositories(root), /distinct/);
});

test("repository pull refuses dirty or misrouted checkouts before network writes", async (t) => {
  const { root, json } = await fixture(t);
  await json(".cloudigniter/repositories.json", {
    schemaVersion: 1,
    baseBranch: "main",
    projects: {
      core: {
        type: "package",
        package: "@cloudigniter/core",
        sourcePath: "packages/core",
        sourceRepository: "company/core",
        buildRepository: "company/build-core",
        buildVisibility: "private",
        delivery: "npm",
      },
    },
  });
  const output = await mkdtemp(path.join(tmpdir(), "ci-pull-check-"));
  t.after(() => rm(output, { recursive: true, force: true }));
  const git = (...args) =>
    execFileSync("git", args, { cwd: output, stdio: "pipe", encoding: "utf8" });
  git("init", "-b", "main");
  git("config", "user.name", "Test");
  git("config", "user.email", "test@example.invalid");
  git("commit", "--allow-empty", "-m", "fixture");
  git("remote", "add", "origin", "https://github.com/company/core.git");
  const run = async (command, args, cwd, options) => {
    assert.equal(command, "git");
    assert.ok(["rev-parse", "remote", "branch", "status"].includes(args[0]));
    return ciRun(command, args, cwd, options);
  };
  assert.equal(
    (
      await ciRepositoryCheckout(
        root,
        "pull",
        "core",
        { output, dryRun: true },
        run
      )
    ).status,
    "preview"
  );
  await writeFile(path.join(output, "uncommitted.txt"), "keep me");
  await assert.rejects(
    ciRepositoryCheckout(root, "pull", "core", { output }, run),
    /clean configured/
  );
  assert.equal(git("status", "--porcelain").trim(), "?? uncommitted.txt");
  await rm(path.join(output, "uncommitted.txt"));
  git("remote", "set-url", "origin", "https://github.com/unrelated/core.git");
  await assert.rejects(
    ciRepositoryCheckout(root, "pull", "core", { output }, run),
    /exact company origin/
  );
});

test("missing GitHub CLI reports setup recovery before credential lookup", async (t) => {
  const { root, json } = await fixture(t);
  await json(".cloudigniter/github-profiles.json", {
    schemaVersion: 1,
    profiles: { developer: { username: "alice", role: "developer" } },
  });
  const run = (command, args, cwd, options = {}) => ciRun(command, args, cwd, {
    ...options,
    env: { ...options.env, PATH: "", CLOUDIGNITER_TOOLS_DIR: path.join(root, "missing-tools") },
  });
  await assert.rejects(ciProfileSession(root, "developer", run), /GitHub CLI.*dev github setup/);
});
