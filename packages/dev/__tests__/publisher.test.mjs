import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { get } from "node:http";
import { fixture } from "./fixtures.mjs";
import {
  ciPublisherWorkspace,
  ciPublisherConfigFiles,
  ciPublisherReadConfig,
  ciPublisherSaveConfig,
  ciPublisherBuildTree,
  ciValidatePublisherMetadata,
  ciPublisherIdentity,
} from "../src/publisher-workspace.mjs";
import {
  ciPublisherActions,
  ciPublisherPlan,
} from "../src/publisher-actions.mjs";
import { ciStartPublisher } from "../src/publisher.mjs";
import { ciBuildStepsWithObfuscation } from "../src/build-options.mjs";
import { CiPublisherJobs, ciPublisherRedact } from "../src/publisher-jobs.mjs";
import { publisherGroups } from "../src/publisher/assets/navigation.mjs";

test("Publisher groups detected projects into ordered categories with alphabetical choices", () => {
  const targets = [
    { id: "packages/ui", label: "ui", kind: "package" },
    { id: "apps/template", label: "template-next-aws", kind: "template" },
    { id: "apps/jodaris", label: "JODARIS Website", kind: "website" },
    { id: "developer-guide", label: "Docs", kind: "docs" },
    { id: "packages/aws", label: "AWS", kind: "package" },
    { id: "packages/core", label: "core", kind: "package" },
  ];
  const original = [...targets];
  const groups = publisherGroups(targets);
  assert.deepEqual(
    groups.map((g) => g.label),
    ["Packages", "Websites", "Templates", "Docs"],
  );
  assert.deepEqual(
    groups[0].targets.map((t) => t.label),
    ["AWS", "core", "ui"],
  );
  assert.deepEqual(
    groups[1].targets.map((t) => t.label),
    ["JODARIS Website"],
  );
  assert.deepEqual(
    groups[2].targets.map((t) => t.label),
    ["template-next-aws"],
  );
  assert.equal(groups[3].targets[0].id, "developer-guide");
  assert.deepEqual(targets, original);
  assert.deepEqual(publisherGroups([]), []);
  assert.deepEqual(
    publisherGroups([targets[0]]).map((g) => g.label),
    ["Packages"],
  );
  const expanded = publisherGroups([
    ...targets,
    { id: "apps/cloudigniter", label: "CloudIgniter Website", kind: "website" },
    { id: "apps/another-template", label: "another-template", kind: "app" },
  ]);
  assert.deepEqual(
    expanded[1].targets.map((t) => t.label),
    ["CloudIgniter Website", "JODARIS Website"],
  );
  assert.deepEqual(
    expanded[2].targets.map((t) => t.label),
    ["another-template", "template-next-aws"],
  );
});

test("Publisher is discoverable without starting a server", () => {
  const result = spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL("../bin/dev.mjs", import.meta.url)),
      "publisher",
      "--help",
    ],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /dev publisher/);
  assert.match(result.stdout, /--port/);
});

test("Publisher rejects invalid options without starting a server", () => {
  const bin = fileURLToPath(new URL("../bin/dev.mjs", import.meta.url));
  for (const args of [
    ["publisher", "extra"],
    ["publisher", "--summary=unexpected"],
    ["npm", "plan", "--port=0"],
    ["publisher", "--port=65536"],
  ]) {
    const result = spawnSync(process.execPath, [bin, ...args], {
      encoding: "utf8",
    });
    assert.equal(result.status, 2, result.stderr);
  }
});

test("Publisher sessions expire and reject forged Host headers", async (t) => {
  const { root } = await setup(t);
  const publisher = await ciStartPublisher({ root, port: 0, sessionTtlMs: 0 });
  t.after(() => publisher.close());
  const headers = { Authorization: `Bearer ${publisher.token}` };
  assert.equal(
    (await fetch(`${publisher.origin}/api/workspace`, { headers })).status,
    401,
  );
  const status = await new Promise((resolve, reject) => {
    get(
      `${publisher.origin}/api/workspace`,
      { headers: { ...headers, Host: "attacker.invalid" } },
      (response) => {
        response.resume();
        resolve(response.statusCode);
      },
    ).on("error", reject);
  });
  assert.equal(status, 403);
});

test(
  "cancellation retains the single-job lock until the child exits",
  { timeout: 10000 },
  async () => {
    const jobs = new CiPublisherJobs();
    const plan = {
      target: "fixture",
      action: "check",
      label: "Check",
      profile: null,
      destination: "Local workspace",
      remote: false,
      commands: [
        {
          command: process.execPath,
          args: ["-e", "setTimeout(() => {}, 9000)"],
          cwd: process.cwd(),
        },
      ],
    };
    const job = jobs.start(plan);
    jobs.cancel(job.id);
    assert.equal(jobs.busy(), true);
    assert.throws(() => jobs.start(plan), /Another action/);
    while (!job.finishedAt)
      await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(job.status, "cancelled");
    assert.equal(jobs.busy(), false);
  },
);

async function setup(t) {
  const f = await fixture(t);
  await f.json("packages/core/package.json", {
    name: "@cloudigniter/core",
    version: "0.1.0",
    exports: { ".": "./src/index.ts" },
    scripts: {
      test: "node check.mjs",
      "switch:src": "dev package switch --target=src",
      "switch:dist": "dev package switch --target=dist",
      build: "dev package build --mode=dev",
    },
  });
  await f.json(".cloudigniter/github-profiles.json", {
    schemaVersion: 1,
    profiles: { developer: { username: "developer", role: "developer" } },
  });
  return f;
}

test("discovery includes a static metadata project and omits placeholders and absent projects", async (t) => {
  const { root, json } = await setup(t);
  await json("apps/site/publisher.config.json", {
    schemaVersion: 1,
    label: "Static site",
    kind: "website",
    buildDirectories: ["dist"],
    commands: {
      check: { label: "Check", command: "node", args: ["scripts/check.mjs"] },
    },
  });
  await mkdir(path.join(root, "apps/docs"), { recursive: true });
  await writeFile(path.join(root, "apps/docs/README.md"), "Reserved");
  const state = await ciPublisherWorkspace(root);
  assert.ok(state.targets.some((t) => t.id === "apps/site"));
  assert.ok(!state.targets.some((t) => t.id === "apps/docs"));
  const core = state.targets.find((t) => t.id === "packages/core");
  assert.equal(core.exportMode, "src");
  assert.ok(ciPublisherActions(core).some((a) => a.id === "npm:publish"));
  assert.ok(!ciPublisherActions(core).some((a) => a.id === "script:quality"));
  assert.ok(ciPublisherActions(core).some((a) => a.id === "switch:dist"));
});

test("metadata validates capability and path boundaries", () => {
  for (const metadata of [
    { schemaVersion: 2 },
    { schemaVersion: 1, token: "secret" },
    { schemaVersion: 1, buildDirectories: ["../outside"] },
    {
      schemaVersion: 1,
      commands: {
        run: { label: "Bad", command: "bash", args: ["-c", "echo unsafe"] },
      },
    },
    {
      schemaVersion: 1,
      commands: {
        run: { label: "Bad", command: "pnpm", args: ["exec", "sh"] },
      },
    },
  ])
    assert.throws(() => ciValidatePublisherMetadata(metadata));
});

test("plans map to existing commands, preserve cwd and pass input as arguments", async (t) => {
  const { root } = await setup(t);
  const core = (await ciPublisherWorkspace(root)).targets.find(
    (t) => t.id === "packages/core",
  );
  const script = await ciPublisherPlan(
    root,
    core,
    "script:test",
    {},
    "developer",
  );
  assert.deepEqual(script.commands[0].args, ["run", "test"]);
  assert.equal(script.commands[0].cwd, path.join(root, "packages/core"));
  const summary = "Fix $(touch /tmp/not-executed); literal summary";
  const plan = await ciPublisherPlan(
    root,
    core,
    "npm:publish",
    { intent: "fix", summary },
    "developer",
  );
  assert.ok(plan.commands[0].args.includes(`--summary=${summary}`));
  assert.ok(plan.commands[0].args.includes("--profile=developer"));
  await assert.rejects(
    ciPublisherPlan(root, core, "run-shell", { command: "whoami" }, null),
  );
  await assert.rejects(
    ciPublisherPlan(root, core, "script:test", { command: "whoami" }, null),
  );
  await assert.rejects(
    ciPublisherPlan(root, core, "npm:publish", { intent: "fix" }, null),
    /summary/,
  );
  await assert.rejects(
    ciPublisherPlan(root, core, "build", { mode: "dev" }, null),
    /development build/,
  );
});

test("obfuscation choices preserve other build steps and source recipes", () => {
  const steps = [
    { file: "ci-clean.mjs", message: "clean" },
    { file: "ci-build-js.mjs", message: "build" },
    { file: "ci-obfuscate-package.mjs", message: "obfuscate" },
    { file: "ci-switch-dist.mjs", message: "switch" },
  ];
  assert.deepEqual(ciBuildStepsWithObfuscation(steps, "configured"), steps);
  assert.deepEqual(
    ciBuildStepsWithObfuscation(steps, "off").map((s) => s.file),
    ["ci-clean.mjs", "ci-build-js.mjs", "ci-switch-dist.mjs"],
  );
  assert.deepEqual(
    ciBuildStepsWithObfuscation(steps, "on").map((s) => s.file),
    steps.map((s) => s.file),
  );
  assert.equal(steps.length, 4);
  assert.throws(() => ciBuildStepsWithObfuscation(steps, "invalid"));
});

test("configuration editor refuses traversal, symlinks, invalid JSON and stale drafts", async (t) => {
  const { root, json } = await setup(t);
  const file = "packages/core/package.json";
  const original = await ciPublisherReadConfig(root, file);
  await assert.rejects(ciPublisherReadConfig(root, "../outside.json"));
  await assert.rejects(
    ciPublisherSaveConfig(root, file, "{broken", original.revision),
    /JSON/,
  );
  await json(file, { name: "@cloudigniter/core", version: "0.2.0" });
  await assert.rejects(
    ciPublisherSaveConfig(root, file, original.content, original.revision),
    /changed on disk/,
  );
  const latest = await ciPublisherReadConfig(root, file);
  const updated = await ciPublisherSaveConfig(
    root,
    file,
    original.content,
    latest.revision,
  );
  assert.equal(updated.content, original.content);
  await symlink(
    path.join(root, "package.json"),
    path.join(root, "packages/core/tsconfig.json"),
  );
  assert.ok(
    !(await ciPublisherConfigFiles(root, "packages/core")).includes(
      "packages/core/tsconfig.json",
    ),
  );
  await assert.rejects(
    ciPublisherReadConfig(root, "packages/core/tsconfig.json"),
  );
});

test("build viewer reports absent output and refuses linked artifacts", async (t) => {
  const { root } = await setup(t);
  const absent = await ciPublisherBuildTree(root, "packages/core");
  assert.equal(absent.entries[0].type, "not built");
  await mkdir(path.join(root, "packages/core/dist"));
  await writeFile(
    path.join(root, "packages/core/dist/index.js"),
    "export const value = 1;",
  );
  await symlink(
    path.join(root, ".cloudigniter"),
    path.join(root, "packages/core/dist/private"),
  );
  const tree = await ciPublisherBuildTree(root, "packages/core");
  assert.ok(tree.entries.some((e) => e.path === "dist/index.js" && e.size > 0));
  assert.ok(tree.entries.some((e) => e.type.includes("symlink")));
  assert.ok(!tree.entries.some((e) => e.path.includes("release-policy")));
});

test("identity distinguishes the active account from a verified named profile", async (t) => {
  const { root } = await setup(t);
  const calls = [];
  const run = async (cmd, args, cwd, opts) => {
    calls.push({ cmd, args, opts });
    if (args.includes("--jq")) return "shell-user";
    if (args[0] === "auth") return "stored-credential";
    return JSON.stringify({ login: "developer", type: "User" });
  };
  const result = await ciPublisherIdentity(root, "developer", run);
  assert.equal(result.active.login, "shell-user");
  assert.equal(result.selected.login, "developer");
  assert.equal(result.selected.verified, true);
  assert.ok(!JSON.stringify(result).includes("stored-credential"));
  assert.ok(!calls.some((c) => c.args.includes("switch")));
});

test("HTTP session requires authentication, rejects foreign origins and stale command previews", async (t) => {
  const { root, json } = await setup(t);
  const publisher = await ciStartPublisher({ root, port: 0 });
  t.after(() => publisher.close());
  const headers = {
    Authorization: `Bearer ${publisher.token}`,
    "Content-Type": "application/json",
  };
  assert.equal((await fetch(`${publisher.origin}/api/workspace`)).status, 401);
  assert.equal(
    (
      await fetch(`${publisher.origin}/api/workspace`, {
        headers: { ...headers, Origin: "https://evil.invalid" },
      })
    ).status,
    403,
  );
  const state = await fetch(`${publisher.origin}/api/workspace`, {
    headers,
  }).then((r) => r.json());
  assert.ok(state.targets.length > 0);
  const preview = await fetch(`${publisher.origin}/api/plan`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      target: "packages/core",
      action: "script:test",
      input: {},
    }),
  }).then((r) => r.json());
  assert.ok(preview.id);
  await json("packages/core/package.json", {
    name: "@cloudigniter/core",
    version: "0.1.0",
    scripts: { test: "node changed.mjs" },
  });
  const run = await fetch(`${publisher.origin}/api/run`, {
    method: "POST",
    headers,
    body: JSON.stringify({ id: preview.id }),
  });
  assert.equal(run.status, 400);
  assert.match((await run.json()).error, /changed/);
  assert.equal(publisher.jobs.jobs.length, 0);
  const index = await fetch(publisher.origin).then((r) => r.text());
  assert.match(index, /PUBLISHING DESTINATION/);
  assert.match(index, /type="module"/);
  const navigation = await fetch(`${publisher.origin}/navigation.mjs`);
  assert.equal(navigation.status, 200);
  assert.match(navigation.headers.get("content-type"), /javascript/);
});

test("jobs stream redacted output, preserve exit codes and serialize running actions", async () => {
  const jobs = new CiPublisherJobs();
  const plan = {
    target: "fixture",
    action: "check",
    label: "Check",
    profile: null,
    destination: "Local workspace",
    remote: false,
    commands: [
      {
        command: process.execPath,
        args: [
          "-e",
          "console.log('ghp_examplePrivateToken'); console.error('expected failure'); process.exitCode=7",
        ],
        cwd: process.cwd(),
      },
    ],
  };
  const job = jobs.start(plan);
  assert.throws(() => jobs.start(plan), /Another action/);
  while (!job.finishedAt)
    await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(job.status, "failed");
  assert.equal(job.exitCode, 7);
  assert.ok(!job.log.includes("ghp_examplePrivateToken"));
  assert.match(job.log, /\[REDACTED\]/);
  assert.match(job.log, /expected failure/);
  assert.equal(
    ciPublisherRedact("password=private-value"),
    "password=[REDACTED]",
  );
});
