import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { fixture } from "./fixtures.mjs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ciGithubWorkflow } from "../src/github-workflow.mjs";

const bin = fileURLToPath(new URL("../bin/dev.mjs", import.meta.url));

test("GitHub login requires an explicit profile before opening a browser", async (t) => {
  const { root } = await fixture(t);
  const result = spawnSync(process.execPath, [bin, "github", "auth", "login"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /login requires --profile/);
});

async function setup(
  t,
  {
    login = "release-manager",
    head = "a".repeat(40),
    author = "developer",
  } = {}
) {
  const { root, json } = await fixture(t);
  await json(".cloudigniter/github-policy.json", {
    schemaVersion: 1,
    workspaceRepository: "cloudigniter-io/cloudigniter",
    backupRepository: "owner/backup",
    requesters: ["developer"],
    template: {
      repository: "cloudigniter-io/template",
      baseBranch: "main",
      reviewers: ["release-manager"],
    },
  });
  await json(".cloudigniter/repositories.json", {
    schemaVersion: 1,
    baseBranch: "main",
    projects: {
      "cloudigniter-core": {
        type: "package",
        package: "@cloudigniter/core",
        sourcePath: "packages/core",
        sourceRepository: "cloudigniter-io/cloudigniter-core",
        buildRepository: "cloudigniter-io/build-cloudigniter-core",
        buildVisibility: "private",
        delivery: "npm",
      },
    },
  });
  const calls = [];
  const run = async (command, args, cwd, options = {}) => {
    calls.push({ command, args, cwd, options });
    if (args[0] === "api") {
      const endpoint = args[5];
      if (endpoint === "user") return JSON.stringify({ type: "User", login });
      if (endpoint.endsWith("/reviews"))
        return JSON.stringify({ state: "APPROVED" });
      if (endpoint.includes("/pulls/"))
        return JSON.stringify({
          state: "open",
          draft: false,
          head: { sha: head },
          base: { ref: "main" },
          user: { login: author },
        });
      return JSON.stringify({
        full_name: endpoint.replace("repos/", ""),
        private: true,
        archived: false,
      });
    }
    return "ok";
  };
  const bodyFile = path.join(root, "review.md");
  await writeFile(bodyFile, "Reviewed the complete change.\nTests passed.\n");
  return { root, json, calls, run, bodyFile };
}

test("workspace reads use configured organization destination, never the backup or current remote", async (t) => {
  const f = await setup(t);
  await ciGithubWorkflow(
    f.root,
    "pr",
    "view",
    { project: "workspace", number: "123" },
    [],
    f.run
  );
  const last = f.calls.at(-1);
  assert.equal(last.command, "gh");
  assert.deepEqual(last.args.slice(0, 3), ["pr", "view", "123"]);
  assert.ok(
    last.args.includes("headRefOid") ||
      last.args.some((value) => value.includes("headRefOid"))
  );
  assert.deepEqual(last.args.slice(-2), [
    "--repo",
    "cloudigniter-io/cloudigniter",
  ]);
});

test("build inspection resolves the package pair", async (t) => {
  const f = await setup(t);
  await ciGithubWorkflow(
    f.root,
    "run",
    "view",
    { project: "cloudigniter-core", repositoryKind: "build", runId: "12345" },
    [],
    f.run
  );
  assert.deepEqual(f.calls.at(-1).args, [
    "run",
    "view",
    "12345",
    "--repo",
    "cloudigniter-io/build-cloudigniter-core",
  ]);
});

test("PR creation forwards multiline body through stdin and never pushes", async (t) => {
  const f = await setup(t, { login: "developer" });
  await ciGithubWorkflow(
    f.root,
    "pr",
    "create",
    {
      project: "workspace",
      head: "feature/context",
      title: "Update context",
      bodyFile: f.bodyFile,
    },
    [],
    f.run
  );
  const call = f.calls.at(-1);
  assert.equal(call.options.input, await readFile(f.bodyFile, "utf8"));
  assert.ok(call.args.includes("release-manager"));
  assert.ok(call.args.includes("--head"));
  assert.ok(f.calls.every((call) => call.command !== "git"));
});

for (const [name, options] of [
  ["developer identity", { login: "developer" }],
  ["changed head", { head: "b".repeat(40) }],
  ["self review", { author: "release-manager" }],
]) {
  test(`review/merge refuses ${name} before a write`, async (t) => {
    const f = await setup(t, options);
    await assert.rejects(
      ciGithubWorkflow(
        f.root,
        "pr",
        "merge",
        { project: "workspace", number: "123", headSha: "a".repeat(40) },
        [],
        f.run
      )
    );
    assert.ok(
      !f.calls.some((call) => call.args[0] === "pr" && call.args[1] === "merge")
    );
  });
}

test("approval binds its review to the inspected commit and merge uses the same race guard", async (t) => {
  const f = await setup(t);
  const flags = {
    project: "workspace",
    number: "123",
    headSha: "a".repeat(40),
    review: "approve",
    bodyFile: f.bodyFile,
  };
  await ciGithubWorkflow(f.root, "pr", "review", flags, [], f.run);
  const payload = JSON.parse(f.calls.at(-1).options.input);
  assert.equal(payload.commit_id, flags.headSha);
  assert.equal(payload.event, "APPROVE");
  await ciGithubWorkflow(f.root, "pr", "merge", flags, [], f.run);
  assert.ok(f.calls.at(-1).args.includes("--match-head-commit"));
  assert.ok(!f.calls.at(-1).args.includes("--admin"));
});

test("unsupported flags, arbitrary projects and malformed operands fail before invoking gh", async (t) => {
  const f = await setup(t);
  for (const [group, action, flags, argv] of [
    ["pr", "list", { project: "workspace" }, ["--head=ignored"]],
    ["repo", "view", { project: "unconfigured" }, []],
    ["pr", "view", { project: "workspace", number: "--help" }, []],
    [
      "pr",
      "create",
      { project: "workspace", head: "main", title: "x", bodyFile: f.bodyFile },
      [],
    ],
  ])
    await assert.rejects(
      ciGithubWorkflow(f.root, group, action, flags, argv, f.run)
    );
  assert.equal(f.calls.length, 0);
});

test("browser login verifies the new active identity, even if the requested account was previously stored", async (t) => {
  const f = await setup(t, { login: "wrong-user" });
  await f.json(".cloudigniter/github-profiles.json", {
    schemaVersion: 1,
    profiles: { developer: { username: "developer", role: "developer" } },
  });
  await assert.rejects(
    ciGithubWorkflow(
      f.root,
      "auth",
      "login",
      { profile: "developer" },
      [],
      f.run
    ),
    /different account/
  );
  const login = f.calls[0];
  assert.deepEqual(login.args, [
    "auth",
    "login",
    "--hostname",
    "github.com",
    "--web",
    "--git-protocol",
    "https",
  ]);
  assert.equal(login.options.interactive, true);
  assert.equal(login.options.env.GH_TOKEN, undefined);
  assert.ok(!f.calls.some((call) => call.args.includes("switch")));
});

test("everyday PR commands require an explicit configured project", async (t) => {
  const { root } = await fixture(t);
  const result = spawnSync(process.execPath, [bin, "github", "pr", "list"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /--project/);
});
