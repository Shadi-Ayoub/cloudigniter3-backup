import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fixture } from "./fixtures.mjs";
import { ciPlanTemplateExport } from "../src/template-export.mjs";
import {
  ciSubmitTemplate,
  ciDeliverTemplate,
  ciTemplateStatus,
} from "../src/template-publish.mjs";
import { ciReadGithubPolicy } from "../src/github-policy.mjs";
import { ciRun } from "../src/runtime.mjs";

async function setup(t, separate = false) {
  const context = await fixture(t);
  const { root, json } = context;
  await json("package.json", {
    name: "cloudigniter",
    private: true,
    packageManager: "pnpm@10.33.0",
  });
  await json("apps/My Starter/package.json", {
    name: "starter",
    dependencies: { "@cloudigniter/core": "workspace:*" },
  });
  await json("apps/My Starter/tsconfig.json", {
    compilerOptions: { strict: true },
  });
  const policy = {
    schemaVersion: 1,
    source: "apps/My Starter",
    name: "public-starter",
    files: ["package.json", "tsconfig.json"],
    overlays: {},
    versions: { "@cloudigniter/core": "0.1.0" },
    removeDependencies: [],
    scripts: {},
    replacements: {},
  };
  await json(".cloudigniter/template-policy.json", policy);
  const requestRepository = separate
    ? "company/private-starter"
    : "cloudigniter/platform";
  if (separate)
    await json(".cloudigniter/github-policy.json", {
      schemaVersion: 1,
      backupRepository: "owner/backup",
      requesters: ["developer"],
      template: {
        repository: "product/template",
        requestRepository,
        baseBranch: "main",
        reviewers: ["release-manager"],
      },
    });
  const git = (...args) =>
    execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  git("init", "-b", "main");
  git("config", "user.name", "Test");
  git("config", "user.email", "test@example.invalid");
  git("add", ".");
  git("commit", "-m", "fixture");
  const source = git("rev-parse", "HEAD");
  const privateHead = separate ? "b".repeat(40) : source;
  const output = await mkdtemp(path.join(tmpdir(), "ci-publish-output-"));
  t.after(() => rm(output, { recursive: true, force: true }));
  const plan = await ciPlanTemplateExport(root);
  for (const [file, bytes] of plan.files) {
    await mkdir(path.dirname(path.join(output, file)), { recursive: true });
    await writeFile(path.join(output, file), bytes);
  }
  const calls = [];
  const state = {
    login: "developer",
    source,
    pr: null,
    request: null,
    ref: false,
    reviews: [],
    publicPrivate: false,
    requestPrivate: true,
    publicTree: "2".repeat(40),
    publicHead: "1".repeat(40),
    modified: false,
    reviewFailure: false,
    metadata: null,
  };
  const run = async (command, args, cwd, options = {}) => {
    calls.push({ command, args, input: options.input });
    if (command === "git") return ciRun(command, args, cwd, options);
    assert.equal(command, "gh");
    const method = args[4],
      endpoint = args[5];
    const body = options.input ? JSON.parse(options.input) : undefined;
    let value;
    const privateRepo = `repos/${requestRepository}`;
    const publicRepo = "repos/product/template";
    if (endpoint === "user") value = { login: state.login };
    else if (endpoint === privateRepo)
      value = {
        full_name: requestRepository,
        private: state.requestPrivate,
        archived: false,
      };
    else if (endpoint === publicRepo)
      value = {
        full_name: "product/template",
        private: state.publicPrivate,
        archived: false,
        permissions: { push: true },
      };
    else if (endpoint.startsWith(`${privateRepo}/git/ref/heads/main`))
      value = { object: { sha: privateHead } };
    else if (endpoint === `${publicRepo}/git/ref/heads/main`)
      value = { object: { sha: state.publicHead } };
    else if (endpoint === `${privateRepo}/git/commits/${privateHead}`)
      value = { tree: { sha: "a".repeat(40) } };
    else if (endpoint === `${publicRepo}/git/commits/${state.publicHead}`)
      value = { tree: { sha: state.publicTree } };
    else if (endpoint.includes("/pulls?")) value = state.pr ? [state.pr] : [];
    else if (endpoint.startsWith(`${privateRepo}/git/ref/heads/template`)) {
      if (!state.ref) throw new Error("HTTP 404");
      value = { object: { sha: "4".repeat(40) } };
    } else if (endpoint === `${privateRepo}/git/commits/${"4".repeat(40)}`)
      value = {
        tree: { sha: (state.modified ? "f" : "3").repeat(40) },
        parents: [{ sha: privateHead }],
      };
    else if (method === "POST" && endpoint === `${privateRepo}/git/trees`) {
      state.request = JSON.parse(body.tree[0].content);
      value = { sha: "3".repeat(40) };
    } else if (method === "POST" && endpoint === `${privateRepo}/git/commits`)
      value = { sha: "4".repeat(40) };
    else if (method === "POST" && endpoint === `${privateRepo}/git/refs`) {
      state.ref = true;
      value = {};
    } else if (method === "POST" && endpoint === `${privateRepo}/pulls`) {
      state.pr = {
        number: 17,
        html_url: `https://github.com/${requestRepository}/pull/17`,
        title: body.title,
        head: {
          ref: body.head,
          sha: "4".repeat(40),
          repo: { full_name: requestRepository },
        },
        base: { ref: "main" },
        user: { login: "developer" },
        state: "open",
        merged_at: null,
      };
      value = state.pr;
    } else if (endpoint.endsWith("/requested_reviewers")) {
      if (state.reviewFailure) throw new Error("review unavailable");
      value = {};
    } else if (endpoint === `${privateRepo}/pulls/17`) value = state.pr;
    else if (endpoint.includes("/pulls/17/reviews")) value = state.reviews;
    else if (endpoint.includes("/contents/.cloudigniter/template-releases/"))
      value = {
        encoding: "base64",
        content: Buffer.from(JSON.stringify(state.request)).toString("base64"),
      };
    else if (endpoint.startsWith(`${publicRepo}/git/trees/`))
      value = {
        truncated: false,
        tree: [
          {
            path: ".github/CODEOWNERS",
            mode: "100644",
            type: "blob",
            sha: "8".repeat(40),
          },
          ...(state.metadata
            ? [
                {
                  path: ".cloudigniter-template.json",
                  mode: "100644",
                  type: "blob",
                  sha: "9".repeat(40),
                },
                {
                  path: "old.txt",
                  mode: "100644",
                  type: "blob",
                  sha: "8".repeat(40),
                },
              ]
            : []),
        ],
      };
    else if (endpoint === `${publicRepo}/git/blobs/${"9".repeat(40)}`)
      value = {
        encoding: "base64",
        content: Buffer.from(JSON.stringify(state.metadata)).toString("base64"),
      };
    else if (method === "POST" && endpoint === `${publicRepo}/git/trees`)
      value = { sha: "6".repeat(40) };
    else if (method === "POST" && endpoint === `${publicRepo}/git/commits`) {
      assert.deepEqual(body.parents, [state.publicHead]);
      value = { sha: "7".repeat(40) };
    } else if (
      method === "PATCH" &&
      endpoint === `${publicRepo}/git/refs/heads/main`
    ) {
      assert.equal(body.force, false);
      state.publicHead = body.sha;
      state.publicTree = "6".repeat(40);
      value = {};
    } else throw new Error(`Unexpected ${method} ${endpoint}`);
    return JSON.stringify(value);
  };
  const submit = () =>
    ciSubmitTemplate(root, { output, summary: "Reviewed starter" }, run);
  const approve = () => {
    state.pr.merged_at = "2026-09-23T00:00:00Z";
    state.login = "release-manager";
    state.reviews = [
      {
        user: { login: "release-manager" },
        state: "APPROVED",
        commit_id: "4".repeat(40),
      },
    ];
  };
  return { ...context, git, calls, state, run, submit, approve, output };
}

test("template requests send metadata only to the private repository and preserve local Git", async (t) => {
  const { root, git, submit, calls, state, run } = await setup(t);
  const result = await submit();
  assert.equal(result.published, false);
  assert.equal(result.requestRepository, "cloudigniter/platform");
  assert.equal(git("status", "--porcelain"), "");
  assert.equal(git("rev-parse", "HEAD"), state.source);
  assert.ok(
    calls
      .filter((call) => call.command === "gh")
      .every((call) => !call.args[5].includes("product/template"))
  );
  const tree = JSON.parse(
    calls.find((call) => call.args[5]?.endsWith("/git/trees")).input
  ).tree;
  assert.equal(tree.length, 1);
  assert.match(tree[0].path, /^\.cloudigniter\/template-releases\//);
  assert.equal(
    (await ciTemplateStatus(root, "17", run)).status,
    "request-open"
  );
});

test("reviewer delivery uses approved bytes and only the public repository's history", async (t) => {
  const { root, submit, approve, state, calls, run } = await setup(t);
  await submit();
  approve();
  const preview = await ciDeliverTemplate(root, "17", { dryRun: true }, run);
  assert.equal(preview.status, "approved-preview");
  assert.ok(!calls.some((call) => call.args[4] === "PATCH"));
  state.metadata = { schemaVersion: 1, files: ["old.txt"] };
  const delivered = await ciDeliverTemplate(root, "17", {}, run);
  assert.equal(delivered.published, true);
  const tree = JSON.parse(
    calls.find((call) => call.args[5] === "repos/product/template/git/trees")
      .input
  ).tree;
  assert.ok(
    tree.some((entry) => entry.path === "old.txt" && entry.sha === null)
  );
  assert.ok(tree.every((entry) => !entry.path.startsWith(".github/")));
  assert.ok(!JSON.stringify(tree).includes(state.source));
  assert.equal((await ciDeliverTemplate(root, "17", {}, run)).reused, true);
  assert.equal(calls.filter((call) => call.args[4] === "PATCH").length, 1);
});

test("request retries recover reviewer assignment but reject edited request branches", async (t) => {
  const { submit, state, calls } = await setup(t);
  state.reviewFailure = true;
  await assert.rejects(submit(), /Re-run the identical/);
  state.reviewFailure = false;
  assert.equal((await submit()).reused, true);
  assert.equal(
    calls.filter((call) => call.args[5]?.endsWith("/git/refs")).length,
    1
  );
  state.modified = true;
  await assert.rejects(submit(), /will not overwrite/);
});

test("template delivery rejects missing, stale, dismissed and self approvals", async (t) => {
  const { root, submit, approve, state, calls, run } = await setup(t);
  await submit();
  state.login = "release-manager";
  await assert.rejects(
    ciDeliverTemplate(root, "17", {}, run),
    /merged company/
  );
  approve();
  state.reviews = [];
  await assert.rejects(
    ciDeliverTemplate(root, "17", {}, run),
    /needs approval/
  );
  approve();
  state.reviews[0].commit_id = "e".repeat(40);
  await assert.rejects(
    ciDeliverTemplate(root, "17", {}, run),
    /needs approval/
  );
  approve();
  state.reviews.push({
    user: { login: "release-manager" },
    state: "DISMISSED",
    commit_id: "4".repeat(40),
  });
  await assert.rejects(
    ciDeliverTemplate(root, "17", {}, run),
    /needs approval/
  );
  approve();
  state.pr.user.login = "release-manager";
  await assert.rejects(
    ciDeliverTemplate(root, "17", {}, run),
    /needs approval/
  );
  assert.ok(!calls.some((call) => call.args[4] === "PATCH"));
});

test("requesters cannot deliver, unrelated accounts cannot request, and public request repositories are refused", async (t) => {
  const { root, submit, state, calls, run } = await setup(t);
  state.login = "stranger";
  await assert.rejects(submit(), /not a configured requester/);
  state.login = "developer";
  await assert.rejects(
    ciDeliverTemplate(root, "17", {}, run),
    /Only a configured/
  );
  state.requestPrivate = false;
  await assert.rejects(submit(), /configured private repository/);
  assert.ok(!calls.some((call) => call.args[4] === "POST"));
});

test("delivery refuses source drift and a public destination that is private", async (t) => {
  const { root, json, git, submit, approve, state, calls, run } = await setup(
    t
  );
  await submit();
  approve();
  state.publicPrivate = true;
  await assert.rejects(
    ciDeliverTemplate(root, "17", {}, run),
    /public, writable/
  );
  state.publicPrivate = false;
  await json("apps/My Starter/tsconfig.json", {
    compilerOptions: { strict: false },
  });
  git("add", ".");
  git("commit", "-m", "changed template");
  await assert.rejects(
    ciDeliverTemplate(root, "17", {}, run),
    /approved digest/
  );
  assert.ok(!calls.some((call) => call.args[4] === "PATCH"));
});

test("GitHub policy rejects email identities, credentials and backup/public collisions", async (t) => {
  const { root, json } = await fixture(t);
  const original = await ciReadGithubPolicy(root);
  for (const change of [
    { requesters: ["developer@example.invalid"] },
    { token: "do-not-store" },
    { backupRepository: original.template.repository },
  ]) {
    await json(".cloudigniter/github-policy.json", { ...original, ...change });
    await assert.rejects(ciReadGithubPolicy(root));
  }
});

test("explicit template request repository keeps its own private history and delivers approved public bytes", async (t) => {
  const { root, submit, approve, state, calls, run } = await setup(t, true);
  const result = await submit();
  assert.equal(result.requestRepository, "company/private-starter");
  assert.equal(state.request.sourceCommit, state.source);
  const commit = calls.find(
    (call) =>
      call.args[5] === "repos/company/private-starter/git/commits" &&
      call.args[4] === "POST"
  );
  assert.deepEqual(JSON.parse(commit.input).parents, ["b".repeat(40)]);
  assert.equal(
    (await ciTemplateStatus(root, "17", run)).status,
    "request-open"
  );
  approve();
  const delivered = await ciDeliverTemplate(root, "17", {}, run);
  assert.equal(delivered.repository, "product/template");
  assert.ok(
    calls.every((call) => !call.args[5]?.includes("cloudigniter/platform"))
  );
});
