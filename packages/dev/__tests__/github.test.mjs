import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fixture } from "./fixtures.mjs";
import { ciSubmitRelease, ciReleaseStatus } from "../src/github.mjs";
import { ciRun } from "../src/runtime.mjs";

const options = {
  intent: "fix",
  packages: ["@cloudigniter/core"],
  summary: "Fix shell text safely: $(echo nope) `echo nope`\nSecond line.",
};

async function repository(t) {
  const context = await fixture(t);
  const git = (...args) =>
    execFileSync("git", args, {
      cwd: context.root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  git("init", "-b", "main");
  git("config", "user.email", "test@example.invalid");
  git("config", "user.name", "Test Developer");
  git("add", ".");
  git("commit", "-m", "fixture");
  const sha = git("rev-parse", "HEAD");
  const tree = git("rev-parse", "HEAD^{tree}");
  const calls = [];
  const state = {
    sha,
    tree,
    branch: null,
    pr: null,
    failReview: false,
    drift: false,
    foreignTree: false,
    failRef: false,
  };
  const nextTree = "b".repeat(40);
  const nextCommit = "c".repeat(40);
  const run = async (command, args, cwd, runOptions = {}) => {
    calls.push({ command, args, input: runOptions.input });
    if (command === "git") return ciRun(command, args, cwd, runOptions);
    assert.equal(command, "gh");
    assert.equal(args[0], "api");
    const method = args[4];
    const endpoint = args[5];
    const body = runOptions.input ? JSON.parse(runOptions.input) : undefined;
    let result;
    if (endpoint === "user") result = { login: "developer" };
    else if (endpoint.includes("/git/ref/heads/main"))
      result = { object: { sha: state.drift ? "d".repeat(40) : sha } };
    else if (endpoint.includes("/pulls?")) result = state.pr ? [state.pr] : [];
    else if (endpoint.endsWith(`/git/commits/${sha}`))
      result = { tree: { sha: tree } };
    else if (endpoint.includes("/git/ref/heads/release")) {
      if (!state.branch) throw new Error("gh: Not Found (HTTP 404)");
      result = { object: { sha: nextCommit } };
    } else if (endpoint.endsWith(`/git/commits/${nextCommit}`))
      result = {
        tree: { sha: state.foreignTree ? "f".repeat(40) : nextTree },
        parents: [{ sha }],
      };
    else if (method === "POST" && endpoint.endsWith("/git/trees"))
      result = { sha: nextTree };
    else if (method === "POST" && endpoint.endsWith("/git/commits"))
      result = { sha: nextCommit };
    else if (method === "POST" && endpoint.endsWith("/git/refs")) {
      if (state.failRef)
        throw new Error("gh: Reference already exists (HTTP 422)");
      state.branch = body.ref.replace("refs/heads/", "");
      result = { ref: body.ref };
    } else if (method === "POST" && endpoint.endsWith("/pulls")) {
      state.pr = {
        number: 123,
        title: body.title,
        html_url: "https://github.com/cloudigniter/platform/pull/123",
        head: { ref: body.head, repo: { full_name: "cloudigniter/platform" } },
        base: { ref: body.base },
        state: "open",
        merged_at: null,
      };
      result = state.pr;
    } else if (endpoint.endsWith("/requested_reviewers")) {
      if (state.failReview) throw new Error("reviewer unavailable");
      result = {};
    } else if (endpoint.endsWith("/pulls/123")) result = state.pr;
    else throw new Error(`Unexpected request: ${method} ${endpoint}`);
    return JSON.stringify(result);
  };
  return { ...context, git, calls, run, state };
}

test("submission creates review intent on GitHub without local mutation or publication", async (t) => {
  const { root, git, calls, run } = await repository(t);
  const before = git("rev-parse", "HEAD");
  const request = await ciSubmitRelease(root, options, run);
  assert.equal(
    request.url,
    "https://github.com/cloudigniter/platform/pull/123",
  );
  assert.equal(request.published, false);
  assert.equal(git("rev-parse", "HEAD"), before);
  assert.equal(git("status", "--porcelain"), "");
  assert.equal(git("branch", "--show-current"), "main");
  const treeCall = calls.find((call) => call.args[5]?.endsWith("/git/trees"));
  const files = JSON.parse(treeCall.input).tree;
  assert.equal(files.length, 2);
  assert.ok(
    files.some(
      (file) =>
        file.path.startsWith(".changeset/dev-") &&
        file.content.includes(options.summary),
    ),
  );
  assert.ok(files.every((file) => !file.path.endsWith("package.json")));
  const reviewerCall = calls.find((call) =>
    call.args[5]?.endsWith("/requested_reviewers"),
  );
  assert.deepEqual(JSON.parse(reviewerCall.input), {
    reviewers: ["release-manager"],
    team_reviewers: [],
  });
  assert.ok(calls.every((call) => ["git", "gh"].includes(call.command)));
});

test("identical retries reuse the branch and PR and recover reviewer assignment", async (t) => {
  const { root, calls, run, state } = await repository(t);
  state.failReview = true;
  await assert.rejects(
    ciSubmitRelease(root, options, run),
    /Re-run the same command/,
  );
  state.failReview = false;
  const result = await ciSubmitRelease(root, options, run);
  assert.equal(result.reused, true);
  assert.equal(
    calls.filter(
      (call) => call.args[4] === "POST" && call.args[5]?.endsWith("/pulls"),
    ).length,
    1,
  );
  assert.equal(
    calls.filter((call) => call.args[5]?.endsWith("/git/refs")).length,
    1,
  );
});

test("retry refuses to overwrite an edited release branch", async (t) => {
  const { root, calls, run, state } = await repository(t);
  await ciSubmitRelease(root, options, run);
  state.foreignTree = true;
  await assert.rejects(
    ciSubmitRelease(root, options, run),
    /will not overwrite/,
  );
  assert.equal(
    calls.filter((call) => call.args[5]?.endsWith("/git/refs")).length,
    1,
  );
});

test("GitHub base drift fails before any API mutation", async (t) => {
  const { root, calls, run, state } = await repository(t);
  state.drift = true;
  await assert.rejects(
    ciSubmitRelease(root, options, run),
    /differs from GitHub/,
  );
  assert.ok(calls.every((call) => call.args[4] !== "POST"));
});

test("dirty and untracked files fail before GitHub is contacted", async (t) => {
  const { root, calls, run } = await repository(t);
  await writeFile(path.join(root, "new-file.txt"), "work in progress");
  await assert.rejects(
    ciSubmitRelease(root, options, run),
    /clean working tree/,
  );
  assert.ok(calls.every((call) => call.command === "git"));
});

test("feature branches cannot request a release before merge", async (t) => {
  const { root, git, calls, run } = await repository(t);
  git("checkout", "-b", "feature/fix");
  await assert.rejects(
    ciSubmitRelease(root, options, run),
    /must start on main/,
  );
  assert.ok(calls.every((call) => call.command === "git"));
});

test("submission requires explicit repository, reviewers and a meaningful summary", async (t) => {
  const { root, json, policy, run, calls } = await repository(t);
  await assert.rejects(
    ciSubmitRelease(root, { ...options, summary: undefined }, run),
    /requires --summary/,
  );
  await json(".cloudigniter/release-policy.json", {
    ...policy,
    repository: null,
  });
  await assert.rejects(
    ciSubmitRelease(root, options, run),
    /No remote is selected/,
  );
  await json(".cloudigniter/release-policy.json", { ...policy, reviewers: [] });
  await assert.rejects(
    ciSubmitRelease(root, options, run),
    /at least one release reviewer/,
  );
  assert.equal(calls.length, 0);
});

test("a competing release PR blocks another request", async (t) => {
  const { root, run, calls, state } = await repository(t);
  state.pr = {
    number: 122,
    html_url: "https://github.com/cloudigniter/platform/pull/122",
    head: { ref: "release/cloudigniter/another" },
  };
  await assert.rejects(
    ciSubmitRelease(root, options, run),
    /Another release request is open/,
  );
  assert.ok(calls.every((call) => call.args[4] !== "POST"));
});

test("status distinguishes merged requests from npm publication", async (t) => {
  const { root, run, state } = await repository(t);
  await ciSubmitRelease(root, options, run);
  state.pr.merged_at = "2026-09-21T00:00:00Z";
  const result = await ciReleaseStatus(root, "123", run);
  assert.equal(result.status, "request-merged");
  assert.equal(result.publication, "unverified");
  await assert.rejects(
    ciReleaseStatus(root, "--web", run),
    /positive GitHub pull request/,
  );
});

test("prerelease requests include the initial, unconsumed Changesets state", async (t) => {
  const { root, calls, run } = await repository(t);
  await ciSubmitRelease(
    root,
    { ...options, intent: "feature", preid: "beta" },
    run,
  );
  const tree = JSON.parse(
    calls.find((call) => call.args[5]?.endsWith("/git/trees")).input,
  ).tree;
  const pre = JSON.parse(
    tree.find((file) => file.path === ".changeset/pre.json").content,
  );
  assert.deepEqual(pre.changesets, []);
  assert.equal(pre.tag, "beta");
});
