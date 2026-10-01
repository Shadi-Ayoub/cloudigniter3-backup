import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { fixture } from "./fixtures.mjs";
import {
  ciCreateReleasePlan,
  ciDigest,
  ciSerializeChangeset,
} from "../src/release-plan.mjs";
import {
  ciVersionRelease,
  ciBuildCandidate,
  ciStageCandidate,
} from "../src/npm-staging.mjs";

async function setup(t, names = ["@cloudigniter/core", "@cloudigniter/dev"]) {
  const context = await fixture(t);
  const { root, json, policy } = context;
  const plan = await ciCreateReleasePlan(root, {
    intent: "fix",
    packages: names,
    summary: "Reviewed release",
  });
  const request = {
    schemaVersion: 1,
    baseCommit: "a".repeat(40),
    reviewers: policy.reviewers,
    plan,
  };
  const id = ciDigest(request).slice(0, 24);
  await json(`.cloudigniter/releases/${id}.json`, request);
  await writeFile(
    path.join(root, ".changeset", `${plan.newChangeset.id}.md`),
    ciSerializeChangeset(plan.newChangeset),
  );
  const parent = await mkdtemp(path.join(tmpdir(), "ci-npm-artifacts-"));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const directory = path.join(parent, "candidate");
  await mkdir(directory);
  const packages = [];
  for (const entry of plan.releases) {
    const file = `${entry.name.replace(/^@/, "").replace("/", "-")}-${entry.newVersion}.tgz`;
    const bytes = Buffer.from(`archive of ${entry.name}`);
    await writeFile(path.join(directory, file), bytes);
    packages.push({
      name: entry.name,
      version: entry.newVersion,
      access: entry.access,
      file,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    });
  }
  const manifest = {
    schemaVersion: 1,
    request: id,
    sourceCommit: "b".repeat(40),
    repository: policy.repository,
    registry: policy.registry,
    tag: plan.tag,
    packages,
  };
  const manifestFile = path.join(directory, "manifest.json");
  const save = () => writeFile(manifestFile, JSON.stringify(manifest));
  await save();
  const calls = [];
  const state = { version: "11.19.1", failView: "", failStage: "" };
  const run = async (command, args, cwd) => {
    calls.push({ command, args, cwd });
    if (command === "git") {
      if (args[0] === "status") return "";
      if (args[0] === "branch") return "main";
      return args.includes("--show-toplevel") ? root : "b".repeat(40);
    }
    if (command === "tar") {
      const pkg = manifest.packages.find(
        (item) => item.file === path.basename(args[1]),
      );
      assert.ok(pkg);
      return JSON.stringify({
        name: pkg.name,
        version: pkg.version,
        repository: {
          type: "git",
          url: `git+https://github.com/${policy.repository}.git`,
        },
      });
    }
    if (command === "npm") {
      if (args[0] === "--version") return state.version;
      if (args[0] === "view") {
        if (state.failView === args[1]) throw new Error("404");
        return JSON.stringify("0.1.0");
      }
      assert.deepEqual(args.slice(0, 2), ["stage", "publish"]);
      if (args[2].includes(state.failStage) && state.failStage)
        throw new Error("staging failed");
      return "Staged for review: stage-example";
    }
    assert.equal(command, "pnpm");
    if (args.join(" ") === "exec changeset version") {
      for (const release of plan.releases) {
        const original = JSON.parse(
          await readFile(path.join(root, release.path, "package.json"), "utf8"),
        );
        await json(`${release.path}/package.json`, {
          ...original,
          version: release.newVersion,
        });
      }
    }
    if (args[0] === "pack") {
      const release = plan.releases.find(
        (item) => path.join(root, item.path) === cwd,
      );
      const entry = packages.find((item) => item.name === release.name);
      await writeFile(
        path.join(args[2], entry.file),
        `archive of ${entry.name}`,
      );
    }
    return "";
  };
  const env = {
    GITHUB_ACTIONS: "true",
    GITHUB_REPOSITORY: policy.repository,
    GITHUB_REF: "refs/heads/main",
    GITHUB_ACTOR: "release-manager",
  };
  return {
    ...context,
    plan,
    id,
    directory,
    parent,
    manifest,
    manifestFile,
    save,
    calls,
    state,
    run,
    env,
  };
}

test("npm staging validates all archives and stages public/restricted access without publishing", async (t) => {
  const { root, manifestFile, calls, run, env } = await setup(t);
  const preview = await ciStageCandidate(root, manifestFile, true, run, {});
  assert.equal(preview.status, "stage-preview");
  assert.ok(calls.every((call) => call.command !== "npm"));
  const result = await ciStageCandidate(root, manifestFile, false, run, env);
  assert.equal(result.status, "awaiting-npm-approval");
  assert.equal(result.published, false);
  const stages = calls.filter(
    (call) => call.command === "npm" && call.args[0] === "stage",
  );
  assert.equal(stages.length, 2);
  assert.ok(stages.some((call) => call.args.includes("restricted")));
  assert.ok(
    stages.every(
      (call) =>
        call.args.includes("--ignore-scripts") &&
        call.args.includes("https://registry.npmjs.org"),
    ),
  );
  assert.ok(
    !calls.some((call) => call.command === "npm" && call.args[0] === "publish"),
  );
});

test("npm staging refuses tampering before any registry writes", async (t) => {
  const { root, manifest, manifestFile, directory, run, env, calls, save } =
    await setup(t);
  await writeFile(path.join(directory, manifest.packages[1].file), "tampered");
  await assert.rejects(
    ciStageCandidate(root, manifestFile, false, run, env),
    /hash changed/,
  );
  manifest.sourceCommit = "c".repeat(40);
  await save();
  await assert.rejects(
    ciStageCandidate(root, manifestFile, false, run, env),
    /checked-out release/,
  );
  assert.ok(calls.every((call) => call.command !== "npm"));
});

test("npm staging refuses local callers, requester accounts, wrong branches and old npm", async (t) => {
  const { root, manifestFile, run, env, state, calls } = await setup(t);
  for (const change of [
    { GITHUB_ACTIONS: "false" },
    { GITHUB_REPOSITORY: "owner/backup" },
    { GITHUB_ACTOR: "developer" },
    { GITHUB_REF: "refs/heads/feature" },
  ]) {
    await assert.rejects(
      ciStageCandidate(root, manifestFile, false, run, { ...env, ...change }),
      /restricted to/,
    );
  }
  state.version = "11.14.0";
  await assert.rejects(
    ciStageCandidate(root, manifestFile, false, run, env),
    /11.15.0/,
  );
  assert.ok(!calls.some((call) => call.args[0] === "stage"));
});

test("npm staging checks every package exists and preserves partial-stage evidence without direct fallback", async (t) => {
  const { root, manifestFile, manifest, directory, run, env, state, calls } =
    await setup(t);
  state.failView = manifest.packages[1].name;
  await assert.rejects(
    ciStageCandidate(root, manifestFile, false, run, env),
    /404/,
  );
  assert.ok(!calls.some((call) => call.args[0] === "stage"));
  state.failView = "";
  state.failStage = manifest.packages[1].file;
  await assert.rejects(
    ciStageCandidate(root, manifestFile, false, run, env),
    /1 earlier package/,
  );
  const journal = JSON.parse(
    await readFile(path.join(directory, "staging-results.json"), "utf8"),
  );
  assert.equal(journal.staged.length, 1);
  assert.equal(journal.published, false);
  assert.ok(!calls.some((call) => call.args[0] === "publish"));
});

test("version application uses the reviewed Changesets and requires a subsequent version PR", async (t) => {
  const { root, id, run, calls } = await setup(t);
  assert.equal(
    (await ciVersionRelease(root, id, true, run)).status,
    "version-preview",
  );
  assert.ok(calls.every((call) => call.command === "git"));
  assert.equal(
    (await ciVersionRelease(root, id, false, run)).status,
    "version-review-required",
  );
  assert.ok(
    calls.some((call) => call.args.join(" ") === "exec changeset version"),
  );
  assert.ok(
    calls.some(
      (call) =>
        call.args.join(" ") === "install --lockfile-only --ignore-scripts",
    ),
  );
  await assert.rejects(
    ciVersionRelease(root, "../escape", true, run),
    /24-character/,
  );
});

test("candidate builds require committed matching versions, run package gates and hash packed archives", async (t) => {
  const { root, id, run, parent, json, plan, calls } = await setup(t);
  const output = path.join(parent, "built");
  await assert.rejects(
    ciBuildCandidate(root, id, output, run),
    /Commit and review/,
  );
  for (const release of plan.releases)
    await json(`${release.path}/package.json`, {
      name: release.name,
      version: release.newVersion,
      repository: {
        type: "git",
        url: "git+https://github.com/cloudigniter/platform.git",
      },
      scripts: {
        check: "check",
        test: "test",
        "check:package": "check package",
      },
    });
  const result = await ciBuildCandidate(root, id, output, run);
  assert.equal(result.status, "candidate-built");
  assert.equal(result.manifest.packages.length, 2);
  assert.ok(calls.some((call) => call.args.join(" ") === "run check:package"));
  assert.ok(calls.every((call) => call.command !== "npm"));
});

test("staging rejects packed repository and publishConfig overrides before contacting npm", async (t) => {
  const { root, manifestFile, run, env, calls } = await setup(t);
  for (const override of [
    { repository: "https://github.com/other/source.git" },
    { publishConfig: { registry: "https://other.example" } },
    { publishConfig: { access: "restricted" } },
    { publishConfig: { tag: "beta" } },
    { publishConfig: { directory: "another-package" } },
  ]) {
    const altered = async (command, args, cwd) => {
      const value = await run(command, args, cwd);
      return command === "tar"
        ? JSON.stringify({ ...JSON.parse(value), ...override })
        : value;
    };
    await assert.rejects(
      ciStageCandidate(root, manifestFile, false, altered, env),
      /repository.url|publishConfig/,
    );
  }
  assert.ok(calls.every((call) => call.command !== "npm"));
});

test("Next candidates reuse the release gate archive and refuse checksum drift", async (t) => {
  const { root, id, run, parent, json, plan, calls, manifest } = await setup(
    t,
    ["@cloudigniter/next"],
  );
  for (const release of plan.releases)
    await json(`${release.path}/package.json`, {
      name: release.name,
      version: release.newVersion,
      repository: "git+https://github.com/cloudigniter/platform.git",
    });
  const entry = manifest.packages.find(
    (item) => item.name === "@cloudigniter/next",
  );
  assert.ok(entry);
  const checked = path.join(root, "packages/next/coverage/release");
  await mkdir(checked, { recursive: true });
  const bytes = Buffer.from("the Next release gate archive");
  await writeFile(path.join(checked, entry.file), bytes);
  await json("packages/next/coverage/release/package-check.json", {
    name: entry.name,
    version: entry.version,
    tarball: entry.file,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
  const output = path.join(parent, "next-candidate");
  await ciBuildCandidate(root, id, output, run);
  assert.deepEqual(await readFile(path.join(output, entry.file)), bytes);
  assert.ok(calls.some((call) => call.args.join(" ") === "run release:check"));
  assert.ok(!calls.some((call) => call.args[0] === "pack"));
  await writeFile(path.join(checked, entry.file), "changed after gate");
  await assert.rejects(
    ciBuildCandidate(root, id, path.join(parent, "bad-next-candidate"), run),
    /archive hash changed/,
  );
});
