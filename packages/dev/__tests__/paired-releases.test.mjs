import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  readFile,
  writeFile,
  mkdir,
  symlink,
  mkdtemp,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { fixture } from "./fixtures.mjs";
import { ciRun } from "../src/runtime.mjs";
import {
  ciBlobHash,
  ciSubmitPairedRelease,
  ciReadPairedRequest,
} from "../src/paired-releases.mjs";
import { ciReadPolicy } from "../src/policy.mjs";
import { ciVersionRelease, ciBuildCandidate } from "../src/npm-staging.mjs";
import {
  ciDeliverBuilds,
  ciScaffoldBuildRepository,
} from "../src/build-repositories.mjs";
import { ciStageBuiltPackage } from "../src/ci/npm-stage.mjs";

const integration = fileURLToPath(new URL("../../../", import.meta.url));

async function paired(t) {
  const context = await fixture(t);
  const { root, json, policy } = context;
  policy.topology = "paired";
  policy.repository = null;
  await json(".cloudigniter/release-policy.json", policy);
  const projects = {};
  for (const [name, entry] of Object.entries(policy.packages)) {
    const short = name.split("/")[1];
    projects[short] = {
      type: "package",
      package: name,
      sourcePath: entry.path,
      sourceRepository: `company/${short}`,
      buildRepository: `company/build-${short}`,
      buildVisibility: "private",
      delivery: "npm",
    };
    const file = `${entry.path}/package.json`;
    const manifest = JSON.parse(await readFile(path.join(root, file), "utf8"));
    await json(file, {
      ...manifest,
      repository: {
        type: "git",
        url: `git+https://github.com/company/build-${short}.git`,
      },
      scripts: { check: "check", test: "test", "check:package": "check" },
    });
    await mkdir(path.join(root, entry.path, "src"));
    await writeFile(
      path.join(root, entry.path, "src/index.js"),
      `export const name = ${JSON.stringify(name)};\n`
    );
  }
  await json(".cloudigniter/repositories.json", {
    schemaVersion: 1,
    baseBranch: "main",
    projects,
  });
  await symlink(
    path.join(integration, "node_modules"),
    path.join(root, "node_modules"),
    "dir"
  );
  await writeFile(path.join(root, ".gitignore"), "node_modules/\n");
  const git = (...args) =>
    execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  git("init", "-b", "main");
  git("config", "user.name", "Fixture");
  git("config", "user.email", "fixture@example.invalid");
  git("add", ".");
  git("commit", "-m", "fixture");
  const calls = [];
  const repositories = new Map();
  for (const project of Object.values(projects))
    for (const repository of [
      project.sourceRepository,
      project.buildRepository,
    ]) {
      const tree = new Map();
      const blobs = new Map();
      if (repository.includes("build-")) {
        const bytes = Buffer.from("reviewed workflow");
        blobs.set(ciBlobHash(bytes), bytes);
        tree.set(".github/workflows/npm-stage.yml", ciBlobHash(bytes));
      }
      repositories.set(repository, {
        main: "a".repeat(40),
        refs: new Map(),
        commits: new Map([
          ["a".repeat(40), { tree: "b".repeat(40), parents: [] }],
        ]),
        trees: new Map([["b".repeat(40), tree]]),
        blobs,
        prs: [],
        approval: true,
      });
    }
  const run = async (command, args, cwd, options = {}) => {
    calls.push({ command, args, cwd, input: options.input });
    if (command === "git") return ciRun(command, args, cwd, options);
    if (command === "pnpm") {
      if (args.join(" ") === "exec changeset version")
        return ciRun(command, args, cwd, options);
      if (args[0] === "pack") {
        const manifest = JSON.parse(
          await readFile(path.join(cwd, "package.json"), "utf8")
        );
        await writeFile(
          path.join(
            args[2],
            `${manifest.name.replace(/^@/, "").replace("/", "-")}-${
              manifest.version
            }.tgz`
          ),
          JSON.stringify(manifest)
        );
      }
      return "";
    }
    if (command === "tar") return readFile(args[1], "utf8");
    assert.equal(command, "gh");
    const method = args[4],
      endpoint = args[5],
      body = options.input ? JSON.parse(options.input) : undefined;
    if (endpoint === "user")
      return JSON.stringify({ login: "developer", type: "User" });
    const match = /^repos\/([^/]+\/[^/]+)(.*)$/.exec(endpoint);
    assert.ok(match, endpoint);
    const [, repository, rest] = match;
    const state = repositories.get(repository);
    assert.ok(state, repository);
    const reply = (value) => JSON.stringify(value);
    const missing = () => {
      throw new Error("gh: HTTP 404");
    };
    if (!rest)
      return reply({ full_name: repository, private: true, archived: false });
    if (rest.startsWith("/git/ref/heads/")) {
      const branch = decodeURIComponent(rest.slice(15));
      const sha = branch === "main" ? state.main : state.refs.get(branch);
      return sha ? reply({ object: { sha } }) : missing();
    }
    if (rest === "/git/blobs" && method === "POST") {
      const bytes = Buffer.from(body.content, body.encoding);
      const sha = ciBlobHash(bytes);
      state.blobs.set(sha, bytes);
      return reply({ sha });
    }
    if (rest === "/git/trees" && method === "POST") {
      const tree = new Map(state.trees.get(body.base_tree));
      for (const file of body.tree) {
        if (file.sha === null) {
          tree.delete(file.path);
          continue;
        }
        const bytes =
          file.content === undefined
            ? state.blobs.get(file.sha)
            : Buffer.from(file.content);
        assert.ok(bytes, file.path);
        const sha = ciBlobHash(bytes);
        state.blobs.set(sha, bytes);
        tree.set(file.path, sha);
      }
      const sha = createHash("sha1")
        .update(JSON.stringify([...tree].sort()))
        .digest("hex");
      state.trees.set(sha, tree);
      return reply({ sha });
    }
    if (rest === "/git/commits" && method === "POST") {
      const sha = createHash("sha1").update(JSON.stringify(body)).digest("hex");
      state.commits.set(sha, { tree: body.tree, parents: body.parents });
      return reply({ sha });
    }
    if (rest.startsWith("/git/commits/")) {
      const commit = state.commits.get(rest.slice(13));
      assert.ok(commit, rest);
      return reply({
        tree: { sha: commit.tree },
        parents: commit.parents.map((sha) => ({ sha })),
      });
    }
    if (rest === "/git/refs" && method === "POST") {
      state.refs.set(body.ref.replace("refs/heads/", ""), body.sha);
      return reply({});
    }
    if (rest.startsWith("/pulls?")) {
      return reply(
        state.prs.filter((pr) =>
          rest.includes("state=closed") ? pr.merged_at : !pr.merged_at
        )
      );
    }
    if (rest === "/pulls" && method === "POST") {
      const pr = {
        number: state.prs.length + 1,
        head: {
          ref: body.head,
          sha: state.refs.get(body.head),
          repo: { full_name: repository },
        },
        base: { ref: body.base },
        user: { login: "developer" },
        merged_at: null,
        html_url: `https://github.com/${repository}/pull/${
          state.prs.length + 1
        }`,
      };
      state.prs.push(pr);
      return reply(pr);
    }
    if (rest.endsWith("/requested_reviewers")) return reply({});
    if (rest.endsWith("/reviews")) {
      const pr = state.prs[Number(rest.split("/")[2]) - 1];
      return reply(
        state.approval
          ? [
              {
                user: { login: "release-manager" },
                state: "APPROVED",
                commit_id: pr.head.sha,
              },
            ]
          : []
      );
    }
    if (rest.includes("/reviews?")) {
      const pr = state.prs[Number(rest.split("/")[2]) - 1];
      return reply(
        state.approval
          ? [
              {
                user: { login: "release-manager" },
                state: "APPROVED",
                commit_id: pr.head.sha,
              },
            ]
          : []
      );
    }
    if (rest.startsWith("/contents/")) {
      const url = new URL("https://example.invalid" + rest);
      let ref = url.searchParams.get("ref");
      if (ref === "main") ref = state.main;
      const commit = state.commits.get(ref);
      assert.ok(commit, rest);
      const file = decodeURIComponent(url.pathname.slice(10));
      const sha = state.trees.get(commit.tree).get(file);
      return sha
        ? reply({
            encoding: "base64",
            content: state.blobs.get(sha).toString("base64"),
          })
        : missing();
    }
    if (rest.startsWith("/git/trees/")) {
      let sha = rest.slice(11).split("?")[0];
      sha = state.commits.get(sha)?.tree ?? sha;
      const tree = state.trees.get(sha);
      assert.ok(tree, rest);
      return reply({
        truncated: false,
        tree: [...tree].map(([name, hash]) => ({
          path: name,
          sha: hash,
          type: "blob",
        })),
      });
    }
    throw new Error("Unexpected GitHub call: " + endpoint);
  };
  const mergeSources = () => {
    for (const [repo, state] of repositories) {
      if (repo.includes("build-")) continue;
      for (const pr of state.prs) {
        pr.merged_at = "2026-09-23T00:00:00Z";
        state.main = pr.head.sha;
      }
    }
  };
  const temporary = await mkdtemp(path.join(tmpdir(), "ci-paired-output-"));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  return { ...context, git, run, calls, repositories, mergeSources, temporary };
}

test("paired publication requests contain real Changesets versioned source and preserve the integration checkout", async (t) => {
  const { root, git, run, repositories, mergeSources } = await paired(t);
  const before = git("rev-parse", "HEAD");
  const result = await ciSubmitPairedRelease(
    root,
    {
      intent: "fix",
      packages: ["@cloudigniter/core"],
      summary: "Fix reviewed source",
    },
    run
  );
  assert.ok(result.requests.length >= 1);
  assert.equal(result.published, false);
  assert.equal(git("rev-parse", "HEAD"), before);
  assert.equal(git("status", "--porcelain"), "");
  for (const item of result.requests) {
    const state = repositories.get(item.repository);
    const pr = state.prs[0];
    const commit = state.commits.get(pr.head.sha);
    assert.deepEqual(commit.parents, ["a".repeat(40)]);
    const tree = state.trees.get(commit.tree);
    const pkg = JSON.parse(state.blobs.get(tree.get("package.json")));
    assert.equal(pkg.version, "0.1.1");
  }
  await assert.rejects(
    ciReadPairedRequest(root, result.id, await ciReadPolicy(root), run),
    /No valid merged/
  );
  mergeSources();
  const request = await ciReadPairedRequest(
    root,
    result.id,
    await ciReadPolicy(root),
    run
  );
  assert.equal(request.plan.summary, "Fix reviewed source");
  const first = repositories.get(result.requests[0].repository);
  first.prs[0].base.ref = "unprotected-preview";
  await assert.rejects(
    ciReadPairedRequest(root, result.id, await ciReadPolicy(root), run),
    /Merge the reviewed request/
  );
  first.prs[0].base.ref = "main";
  repositories.get(result.requests[0].repository).approval = false;
  await assert.rejects(
    ciReadPairedRequest(root, result.id, await ciReadPolicy(root), run),
    /approver/
  );
});

test("reviewed paired versions build exact candidates and request immutable archives in their matching build repositories", async (t) => {
  const { root, git, run, mergeSources, temporary, repositories } =
    await paired(t);
  const submitted = await ciSubmitPairedRelease(
    root,
    { intent: "fix", packages: ["@cloudigniter/dev"], summary: "Fix DEV" },
    run
  );
  mergeSources();
  await ciVersionRelease(root, submitted.id, false, run);
  git("add", ".");
  git("commit", "-m", "Apply reviewed versions");
  const candidate = await ciBuildCandidate(
    root,
    submitted.id,
    path.join(temporary, "candidate"),
    run
  );
  const manifest = path.join(candidate.output, "manifest.json");
  assert.equal(
    (await ciDeliverBuilds(root, manifest, true, run)).status,
    "build-delivery-preview"
  );
  const delivered = await ciDeliverBuilds(root, manifest, false, run);
  assert.equal(delivered.requests[0].repository, "company/build-dev");
  assert.equal(delivered.published, false);
  const state = repositories.get("company/build-dev");
  const tree = state.trees.get(state.commits.get(state.prs[0].head.sha).tree);
  assert.ok(tree.has(".github/workflows/npm-stage.yml"));
  assert.ok(tree.has("releases/0.1.1/package.tgz"));
  await writeFile(
    path.join(candidate.output, candidate.manifest.packages[0].file),
    "tampered"
  );
  await assert.rejects(
    ciDeliverBuilds(root, manifest, false, run),
    /hash changed/
  );
});

test("generated build workflow stages only verified bytes under its own repository and approver", async (t) => {
  const { root, temporary } = await paired(t);
  const generated = await ciScaffoldBuildRepository(
    root,
    "dev",
    path.join(temporary, "build")
  );
  const version = "0.1.1",
    dir = path.join(generated.output, "releases", version);
  await mkdir(dir, { recursive: true });
  const packed = {
    name: "@cloudigniter/dev",
    version,
    repository: { url: "git+https://github.com/company/build-dev.git" },
    publishConfig: { access: "restricted" },
  };
  const bytes = Buffer.from(JSON.stringify(packed));
  await writeFile(path.join(dir, "package.tgz"), bytes);
  await writeFile(
    path.join(dir, "manifest.json"),
    JSON.stringify({
      schemaVersion: 1,
      name: packed.name,
      version,
      access: "restricted",
      registry: "https://registry.npmjs.org",
      tag: "latest",
      repository: "company/build-dev",
      sourceRepository: "company/dev",
      request: "d".repeat(24),
      sha256: createHash("sha256").update(bytes).digest("hex"),
      archive: "package.tgz",
    })
  );
  const calls = [];
  const execute = async (command, args) => {
    calls.push({ command, args });
    if (command === "tar") return JSON.stringify(packed);
    if (args[0] === "--version") return "11.19.1";
    return "stage-id";
  };
  const env = {
    GITHUB_ACTIONS: "true",
    GITHUB_REPOSITORY: "company/build-dev",
    GITHUB_REF: "refs/heads/main",
    GITHUB_ACTOR: "release-manager",
    RELEASE_VERSION: version,
  };
  for (const override of [
    { GITHUB_ACTOR: "developer" },
    { GITHUB_TRIGGERING_ACTOR: "developer" },
    { GITHUB_REPOSITORY: "company/dev" },
    { GITHUB_REF: "refs/heads/feature" },
  ])
    await assert.rejects(
      ciStageBuiltPackage(generated.output, { ...env, ...override }, execute),
      /approver/
    );
  assert.equal(calls.length, 0);
  assert.equal(
    (await ciStageBuiltPackage(generated.output, env, execute)).published,
    false
  );
  assert.ok(
    calls.some((call) => call.args.slice(0, 2).join(" ") === "stage publish")
  );
  assert.ok(!calls.some((call) => call.args[0] === "publish"));
  await writeFile(path.join(dir, "package.tgz"), "tampered");
  await assert.rejects(
    ciStageBuiltPackage(generated.output, env, execute),
    /checksum/
  );
});
