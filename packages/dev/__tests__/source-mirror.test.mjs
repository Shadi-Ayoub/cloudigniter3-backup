import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  writeFile,
  chmod,
  rm,
  readFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  ciMirrorAuthorization,
  ciMirrorDiff,
  ciMirrorSnapshot,
  ciMirrorConfiguration,
  ciMirrorSourceFile,
} from "../src/source-mirror.mjs";
import { ciMirrorGit, ciMirrorSources } from "../src/source-mirror-git.mjs";

const sha = "a".repeat(40),
  head = "b".repeat(40);
const policy = {
  workspaceRepository: "company/workspace",
  baseBranch: "main",
  reviewers: ["maintainer"],
  checkAppId: 15368,
  qualityWorkflows: [
    { path: ".github/workflows/quality.yml", checks: ["Package quality"] },
  ],
};

function evidence(overrides = {}) {
  const repo = {
    full_name: policy.workspaceRepository,
    private: true,
    archived: false,
    default_branch: "main",
  };
  const branch = { name: "main", protected: true, commit: { sha } };
  const pull = {
    number: 1,
    state: "closed",
    draft: false,
    merged_at: "2026-10-04T15:00:00Z",
    merge_commit_sha: sha,
    base: { ref: "main", repo: { full_name: policy.workspaceRepository } },
    head: { sha: head },
    user: { login: "developer" },
  };
  const reviews = [
    {
      id: 1,
      state: "APPROVED",
      commit_id: head,
      user: { login: "maintainer", type: "User" },
    },
  ];
  const checks = [
    {
      id: 1,
      name: "Package quality",
      head_sha: sha,
      status: "completed",
      conclusion: "success",
      app: { id: 15368 },
      details_url: `https://github.com/${policy.workspaceRepository}/actions/runs/10/job/1`,
    },
  ];
  const run = {
    id: 10,
    event: "push",
    head_sha: sha,
    head_branch: "main",
    path: ".github/workflows/quality.yml",
    status: "completed",
    conclusion: "success",
  };
  const values = {
    ...{ repo, branch, pull, reviews, checks, run },
    ...overrides,
  };
  const api = async (endpoint) => {
    if (endpoint === `repos/${policy.workspaceRepository}`) return values.repo;
    if (endpoint.endsWith("/branches/main")) return values.branch;
    if (endpoint.includes("/commits/") && endpoint.includes("/pulls?"))
      return [values.pull];
    if (endpoint.includes("/pulls/1/reviews?")) return values.reviews;
    if (endpoint.includes("/check-runs?"))
      return { total_count: values.checks.length, check_runs: values.checks };
    if (endpoint.endsWith("/actions/runs/10")) return values.run;
    throw new Error(`Unexpected evidence request: ${endpoint}`);
  };
  return { ...values, api };
}

test("source mirroring grants authority only for the independently approved merge with green merged-commit CI", async () => {
  const result = await ciMirrorAuthorization(policy, sha, evidence().api);
  assert.equal(result.status, "authorized");
  assert.equal(result.workspaceCommit, sha);
  assert.equal(result.pullRequest.headCommit, head);
  assert.deepEqual(result.pullRequest.approvedBy, ["maintainer"]);
});

for (const [name, update, message] of [
  [
    "public workspace",
    (v) => ({ repo: { ...v.repo, private: false } }),
    /identity/,
  ],
  [
    "unprotected workspace",
    (v) => ({ branch: { ...v.branch, protected: false } }),
    /protected/,
  ],
  [
    "direct push",
    (v) => ({ pull: { ...v.pull, merge_commit_sha: head } }),
    /merged company PR/,
  ],
  [
    "wrong PR base",
    (v) => ({ pull: { ...v.pull, base: { ...v.pull.base, ref: "preview" } } }),
    /merged company PR/,
  ],
  [
    "self approval",
    (v) => ({ pull: { ...v.pull, user: { login: "maintainer" } } }),
    /Independent/,
  ],
  [
    "stale approval",
    (v) => ({ reviews: [{ ...v.reviews[0], commit_id: sha }] }),
    /exact PR head/,
  ],
  [
    "dismissed approval",
    (v) => ({ reviews: [{ ...v.reviews[0], state: "DISMISSED" }] }),
    /Independent/,
  ],
  [
    "changes requested after approval",
    (v) => ({
      reviews: [
        ...v.reviews,
        { ...v.reviews[0], id: 2, state: "CHANGES_REQUESTED" },
      ],
    }),
    /Independent/,
  ],
  [
    "failed merged check",
    (v) => ({ checks: [{ ...v.checks[0], conclusion: "failure" }] }),
    /check failed/,
  ],
  [
    "PR check used as merge evidence",
    (v) => ({ run: { ...v.run, event: "pull_request" } }),
    /push workflows/,
  ],
  [
    "wrong workflow",
    (v) => ({ run: { ...v.run, path: ".github/workflows/forged.yml" } }),
    /configured push/,
  ],
  [
    "wrong run SHA",
    (v) => ({ run: { ...v.run, head_sha: head } }),
    /merged commit/,
  ],
]) {
  test(`source mirror denies ${name}`, async () => {
    await assert.rejects(
      ciMirrorAuthorization(policy, sha, evidence(update(evidence())).api),
      message,
    );
  });
}

test("incomplete checks wait; superseded commits never grant mirror authority", async () => {
  assert.equal(
    (await ciMirrorAuthorization(policy, sha, evidence({ checks: [] }).api))
      .status,
    "waiting",
  );
  const v = evidence();
  assert.equal(
    (
      await ciMirrorAuthorization(
        policy,
        sha,
        evidence({ checks: [{ ...v.checks[0], app: { id: 99 } }] }).api,
      )
    ).status,
    "waiting",
  );
  assert.equal(
    (
      await ciMirrorAuthorization(
        policy,
        sha,
        evidence({ branch: { ...v.branch, commit: { sha: head } } }).api,
      )
    ).status,
    "superseded",
  );
});

test("comments preserve approval, while incomplete approval pagination is refused", async () => {
  const v = evidence();
  const commented = evidence({
    reviews: [...v.reviews, { ...v.reviews[0], id: 2, state: "COMMENTED" }],
  });
  assert.equal(
    (await ciMirrorAuthorization(policy, sha, commented.api)).status,
    "authorized",
  );
  const truncated = async (endpoint) =>
    endpoint.includes("/reviews?")
      ? Array(100).fill(v.reviews[0])
      : v.api(endpoint);
  await assert.rejects(
    ciMirrorAuthorization(policy, sha, truncated),
    /listing limit/,
  );
});

test("managed drift and unmanaged collisions are refused; already matching reviewed changes can reconcile", () => {
  const a = { mode: "100644", blob: "1".repeat(40) },
    b = { ...a, blob: "2".repeat(40) },
    c = { ...a, blob: "3".repeat(40) };
  assert.throws(
    () => ciMirrorDiff({ "a.ts": a }, { "a.ts": b }, { "a.ts": c }),
    /drift/,
  );
  assert.throws(
    () => ciMirrorDiff({}, { "a.ts": b }, { "a.ts": c }),
    /unmanaged/,
  );
  assert.throws(
    () => ciMirrorDiff({}, { "src/a.ts": b }, { src: c }),
    /directory collision/,
  );
  assert.deepEqual(
    ciMirrorDiff({ "a.ts": a }, { "a.ts": b }, { "a.ts": b }),
    [],
  );
  assert.deepEqual(
    ciMirrorDiff(
      {},
      JSON.parse(
        '{"__proto__":{"mode":"100644","blob":"1111111111111111111111111111111111111111"}}',
      ),
      {},
    ),
    [{ path: "__proto__", ...a }],
  );
});

async function workspace(t) {
  const temporary = await mkdtemp(path.join(tmpdir(), "ci-mirror-test-"));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const root = path.join(temporary, "workspace"),
    remote = path.join(temporary, "source.git");
  await mkdir(root);
  await mkdir(remote);
  const git = (cwd, ...args) =>
    execFileSync(
      "git",
      [
        "-c",
        "core.hooksPath=/dev/null",
        "-c",
        "user.name=Test",
        "-c",
        "user.email=test@example.invalid",
        ...args,
      ],
      { cwd, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] },
    ).trim();
  git(root, "init", "--initial-branch=main");
  git(remote, "init", "--bare", "--initial-branch=main");
  const put = async (name, contents) => {
    const file = path.join(root, name);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(
      file,
      typeof contents === "string" || Buffer.isBuffer(contents)
        ? contents
        : JSON.stringify(contents),
    );
  };
  await put(".cloudigniter/source-mirroring.json", {
    schemaVersion: 1,
    workspaceRepository: policy.workspaceRepository,
    checkAppId: policy.checkAppId,
    qualityWorkflows: policy.qualityWorkflows,
  });
  await put(".cloudigniter/github-policy.json", {
    workspaceRepository: policy.workspaceRepository,
  });
  await put(".cloudigniter/release-policy.json", {
    baseBranch: "main",
    reviewers: ["maintainer"],
  });
  const inventory = {
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
  await put(".cloudigniter/repositories.json", inventory);
  await put("packages/core/package.json", {
    name: "@cloudigniter/core",
    version: "0.1.0",
    scripts: { postinstall: "exit 93" },
  });
  await put("packages/core/src/old.ts", "export const old = 1;\n");
  await put("packages/core/run.sh", "#!/bin/sh\nexit 94\n");
  await chmod(path.join(root, "packages/core/run.sh"), 0o755);
  await put("packages/core/image.bin", Buffer.from([0, 255, 10, 3]));
  await put(
    "packages/core/src/kept.generated.ts",
    "export const generated = true;\n",
  );
  await put("packages/core/.env", "not-source\n");
  await put("packages/core/dist/generated.js", "not-source\n");
  await put("packages/core/.github/workflows/untrusted.yml", "not-source\n");
  git(root, "add", ".");
  git(root, "commit", "-m", "Reviewed initial source");
  const calls = [];
  const transport = async (args, cwd, input, env) => {
    calls.push({ args, cwd, env });
    return ciMirrorGit(
      args.map((value) =>
        value === "https://github.com/company/core.git" ? remote : value,
      ),
      cwd,
      input,
      env,
    );
  };
  const readApi = async (endpoint) => {
    const commit = git(root, "rev-parse", "HEAD"),
      v = evidence();
    return evidence({
      branch: { ...v.branch, commit: { sha: commit } },
      pull: { ...v.pull, merge_commit_sha: commit },
      checks: v.checks.map((c) => ({ ...c, head_sha: commit })),
      run: { ...v.run, head_sha: commit },
    }).api(endpoint);
  };
  const destinationApi = async (endpoint) => {
    assert.equal(endpoint, "repos/company/core");
    return {
      full_name: "company/core",
      private: true,
      archived: false,
      default_branch: "main",
    };
  };
  const options = {
    readApi,
    destinationApi,
    token: "fixture-secret-never-in-argv",
    git: transport,
  };
  const mirror = () =>
    ciMirrorSources(root, git(root, "rev-parse", "HEAD"), options);
  const commitRemote = (file, content) => {
    const base = git(remote, "rev-parse", "main");
    git(remote, "read-tree", base);
    const blob = execFileSync("git", ["hash-object", "-w", "--stdin"], {
      cwd: remote,
      input: content,
      encoding: "utf8",
    }).trim();
    git(remote, "update-index", "--add", "--cacheinfo", "100644", blob, file);
    const tree = git(remote, "write-tree"),
      commit = git(
        remote,
        "commit-tree",
        tree,
        "-p",
        base,
        "-m",
        "Destination edit",
      );
    git(remote, "update-ref", "refs/heads/main", commit);
    return commit;
  };
  return {
    root,
    remote,
    git,
    put,
    calls,
    options,
    mirror,
    commitRemote,
    inventory,
  };
}

test("committed inventories preserve binary bytes, executable modes and maintained generated source", async (t) => {
  const f = await workspace(t),
    commit = f.git(f.root, "rev-parse", "HEAD");
  await f.put("packages/core/src/old.ts", "dirty local edit\n");
  const files = await ciMirrorSnapshot(f.root, commit, "packages/core");
  assert.equal(files["run.sh"].mode, "100755");
  assert.ok(files["src/kept.generated.ts"]);
  assert.ok(
    !files[".env"] &&
      !files["dist/generated.js"] &&
      !files[".github/workflows/untrusted.yml"],
  );
  assert.match(f.git(f.root, "show", files["src/old.ts"].blob), /old = 1/);
  for (const file of [
    "../escape",
    "src/../escape",
    ".cloudigniter-mirror.json",
    "src/._file.ts",
    "amplify_outputs.json",
    "build/index.html",
    ".generated/skill.mdx",
  ])
    assert.equal(ciMirrorSourceFile(file), false, file);
});

test("first mirror bootstraps an empty repository and retries without creating another commit", async (t) => {
  const f = await workspace(t);
  const first = await f.mirror();
  assert.equal(first.status, "synchronized");
  assert.equal(first.targets[0].status, "updated");
  const initial = f.git(f.remote, "rev-parse", "main");
  assert.equal(f.git(f.remote, "rev-list", "--count", "main"), "1");
  assert.equal(
    f.git(f.remote, "show", "main:src/old.ts"),
    "export const old = 1;",
  );
  const bytes = execFileSync("git", ["show", "main:image.bin"], {
    cwd: f.remote,
  });
  assert.deepEqual(bytes, Buffer.from([0, 255, 10, 3]));
  const receipt = JSON.parse(
    f.git(f.remote, "show", "main:.cloudigniter-mirror.json"),
  );
  assert.equal(receipt.workspaceCommit, f.git(f.root, "rev-parse", "HEAD"));
  assert.deepEqual(receipt.pullRequest.approvedBy, ["maintainer"]);
  assert.equal((await f.mirror()).targets[0].status, "unchanged");
  assert.equal(f.git(f.remote, "rev-parse", "main"), initial);
  assert.ok(
    f.calls.every(
      (call) =>
        !call.args.some(
          (arg) => arg.includes(f.options.token) || arg.includes("--force"),
        ),
    ),
  );
});

test("reviewed source-root relocation preserves prior mirror ownership and refreshes its receipt", async (t) => {
  const f = await workspace(t);
  await f.mirror();
  const previous = f.git(f.remote, "rev-parse", "main");
  await mkdir(path.join(f.root, "packages/platform"));
  f.git(f.root, "mv", "packages/core", "packages/platform/core");
  f.inventory.projects.core.sourcePath = "packages/platform/core";
  await f.put(".cloudigniter/repositories.json", f.inventory);
  f.git(f.root, "add", ".cloudigniter/repositories.json");
  f.git(f.root, "commit", "-m", "Reviewed source-root move");
  const result = await f.mirror();
  assert.equal(result.status, "synchronized");
  assert.equal(result.targets[0].status, "updated");
  assert.equal(f.git(f.remote, "rev-parse", "main^"), previous);
  assert.equal(JSON.parse(f.git(f.remote, "show", "main:.cloudigniter-mirror.json")).sourcePath, "packages/platform/core");
  assert.equal(f.git(f.remote, "show", "main:src/old.ts"), "export const old = 1;");
  assert.equal((await f.mirror()).targets[0].status, "unchanged");
});

test("later mirrors preserve destination history and governance while removing stale managed source", async (t) => {
  const f = await workspace(t);
  await f.mirror();
  const governance = f.commitRemote(".github/CODEOWNERS", "* @maintainer\n");
  f.git(f.root, "rm", "packages/core/src/old.ts");
  await f.put("packages/core/src/new.ts", "export const next = 2;\n");
  f.git(f.root, "add", ".");
  f.git(f.root, "commit", "-m", "Reviewed replacement");
  const result = await f.mirror();
  assert.equal(result.status, "synchronized");
  assert.equal(f.git(f.remote, "rev-parse", "main^"), governance);
  assert.equal(
    f.git(f.remote, "show", "main:.github/CODEOWNERS"),
    "* @maintainer",
  );
  assert.ok(
    !f
      .git(f.remote, "ls-tree", "-r", "--name-only", "main")
      .split("\n")
      .includes("src/old.ts"),
  );
  assert.equal(
    f.git(f.remote, "show", "main:src/new.ts"),
    "export const next = 2;",
  );
});

test("destination drift and forged ownership block the whole batch before a push", async (t) => {
  const f = await workspace(t);
  await f.mirror();
  const edit = f.commitRemote("src/old.ts", "unreviewed destination change\n");
  const blocked = await f.mirror();
  assert.equal(blocked.status, "blocked");
  assert.match(blocked.targets[0].error, /drift/);
  assert.equal(f.git(f.remote, "rev-parse", "main"), edit);
  f.commitRemote("src/old.ts", "export const old = 1;\n");
  const receipt = JSON.parse(
    f.git(f.remote, "show", "main:.cloudigniter-mirror.json"),
  );
  receipt.files["unmanaged.txt"] = receipt.files["src/old.ts"];
  const forged = f.commitRemote(
    ".cloudigniter-mirror.json",
    JSON.stringify(receipt),
  );
  assert.match((await f.mirror()).targets[0].error, /ownership differs/);
  assert.equal(f.git(f.remote, "rev-parse", "main"), forged);
});

test("an uncertain accepted push is recovered from the destination receipt", async (t) => {
  const f = await workspace(t),
    normal = f.options.git;
  f.options.git = async (...args) => {
    const result = await normal(...args);
    if (args[0][0] === "push")
      throw new Error("Connection lost after acceptance");
    return result;
  };
  assert.equal((await f.mirror()).status, "partial");
  const accepted = f.git(f.remote, "rev-parse", "main");
  f.options.git = normal;
  assert.equal((await f.mirror()).targets[0].status, "unchanged");
  assert.equal(f.git(f.remote, "rev-parse", "main"), accepted);
});

test("a concurrent destination update fails a normal push without overwriting it", async (t) => {
  const f = await workspace(t);
  await f.mirror();
  await f.put("packages/core/src/new.ts", "reviewed\n");
  f.git(f.root, "add", ".");
  f.git(f.root, "commit", "-m", "Reviewed addition");
  const normal = f.options.git;
  let concurrent;
  f.options.git = async (...args) => {
    if (args[0][0] === "push")
      concurrent = f.commitRemote("operator-note.txt", "keep\n");
    return normal(...args);
  };
  const result = await f.mirror();
  assert.equal(result.status, "partial");
  assert.equal(f.git(f.remote, "rev-parse", "main"), concurrent);
  f.options.git = normal;
  assert.equal((await f.mirror()).status, "synchronized");
  assert.equal(f.git(f.remote, "show", "main:operator-note.txt"), "keep");
});

test("independent websites are excluded from source mirroring across repository owners", async (t) => {
  const f = await workspace(t);
  for (const [id, owner] of [["cloudigniter-website", "company"], ["jodaris-website", "jodaris"]]) {
    f.inventory.projects[id] = {
      type: "website",
      sourcePath: null,
      sourceRepository: `${owner}/${id}`,
      buildRepository: `${owner}/build-${id}`,
      buildVisibility: "private",
      delivery: "aws",
    };
  }
  await f.put(".cloudigniter/repositories.json", f.inventory);
  f.git(f.root, "add", ".cloudigniter/repositories.json");
  f.git(f.root, "commit", "-m", "Independent website routing");
  const result = await f.mirror();
  assert.equal(result.status, "synchronized");
  assert.deepEqual(result.targets.filter((item) => item.project.endsWith("-website")).map((item) => item.status), ["unmapped", "unmapped"]);
  assert.ok(!f.calls.some((call) => JSON.stringify(call).includes("jodaris/jodaris-website")));
});

test("source symlinks and inconsistent repository mappings fail safely", async (t) => {
  const f = await workspace(t);
  f.git(
    f.root,
    "update-index",
    "--add",
    "--cacheinfo",
    "120000",
    f.git(f.root, "hash-object", "packages/core/run.sh"),
    "packages/core/link",
  );
  f.git(f.root, "commit", "-m", "Unsupported symlink");
  await assert.rejects(
    ciMirrorSnapshot(
      f.root,
      f.git(f.root, "rev-parse", "HEAD"),
      "packages/core",
    ),
    /symlinks/,
  );
  f.inventory.projects.core.sourceRepository = "other/core";
  await f.put(".cloudigniter/repositories.json", f.inventory);
  f.git(f.root, "add", ".cloudigniter/repositories.json");
  f.git(f.root, "commit", "-m", "Invalid routing");
  await assert.rejects(
    ciMirrorConfiguration(f.root, f.git(f.root, "rev-parse", "HEAD")),
    /company organization/,
  );
});

test("a later invalid destination blocks initialization of every earlier prepared target", async (t) => {
  const f = await workspace(t);
  await f.put("docs/index.mdx", "# Guide\n");
  f.inventory.projects.docs = {
    type: "website",
    sourcePath: "docs",
    sourceRepository: "company/docs",
    buildRepository: "company/build-docs",
    buildVisibility: "private",
    delivery: "aws",
  };
  await f.put(".cloudigniter/repositories.json", f.inventory);
  f.git(f.root, "add", ".");
  f.git(f.root, "commit", "-m", "Reviewed site mapping");
  const normal = f.options.destinationApi;
  f.options.destinationApi = (endpoint) =>
    endpoint === "repos/company/docs"
      ? {
          full_name: "company/docs",
          private: false,
          archived: false,
          default_branch: "main",
        }
      : normal(endpoint);
  const result = await f.mirror();
  assert.equal(result.status, "blocked");
  assert.equal(result.targets[0].status, "prepared");
  assert.equal(result.targets[1].status, "blocked");
  assert.equal(f.git(f.remote, "ls-remote", f.remote), "");
  assert.ok(!f.calls.some((c) => c.args[0] === "push"));
});

test("a canonical advance between preparation and publishing prevents outdated writes", async (t) => {
  const f = await workspace(t),
    normal = f.options.readApi;
  let reads = 0;
  f.options.readApi = async (endpoint) => {
    const result = await normal(endpoint);
    if (endpoint.endsWith("/branches/main") && ++reads > 1)
      return { ...result, commit: { sha: "c".repeat(40) } };
    return result;
  };
  assert.equal((await f.mirror()).status, "superseded");
  assert.equal(f.git(f.remote, "ls-remote", f.remote), "");
});

test("canonical rollback and missing mapped roots never erase a destination", async (t) => {
  const f = await workspace(t);
  await f.mirror();
  const original = f.git(f.root, "rev-parse", "HEAD");
  await f.put("packages/core/src/new.ts", "new\n");
  f.git(f.root, "add", ".");
  f.git(f.root, "commit", "-m", "Reviewed addition");
  await f.mirror();
  const advanced = f.git(f.remote, "rev-parse", "main");
  f.git(f.root, "checkout", "--detach", original);
  assert.match((await f.mirror()).targets[0].error, /replay or rollback/);
  assert.equal(f.git(f.remote, "rev-parse", "main"), advanced);
  f.git(f.root, "checkout", "main");
  f.inventory.projects.core.sourcePath = "packages/missing";
  await f.put(".cloudigniter/repositories.json", f.inventory);
  f.git(f.root, "add", ".");
  f.git(f.root, "commit", "-m", "Missing mapping");
  assert.match(
    (await f.mirror()).targets[0].error,
    /no supported committed files/,
  );
  assert.equal(f.git(f.remote, "rev-parse", "main"), advanced);
});

test("delivery workflow uses only a source-scoped App after verification and installs no candidate dependencies", async () => {
  const workflow = await readFile(
    new URL("../../../.github/workflows/source-mirror.yml", import.meta.url),
    "utf8",
  );
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.match(workflow, /permission-contents: write/);
  assert.match(
    workflow,
    /repositories: \$\{\{ steps.verify.outputs.repositories \}\}/,
  );
  assert.ok(
    !/pull_request|npm (?:publish|stage)|pnpm install|git push.*--force/.test(
      workflow,
    ),
  );
});

test("source mirroring removes only previously managed files", () => {
  const old = { "removed.ts": { mode: "100644", blob: "1".repeat(40) } };
  const incoming = { "new.ts": { mode: "100755", blob: "2".repeat(40) } };
  const current = {
    ...old,
    ".github/CODEOWNERS": { mode: "100644", blob: "3".repeat(40) },
  };
  assert.deepEqual(ciMirrorDiff(old, incoming, current), [
    { path: "removed.ts", mode: "0", blob: "0".repeat(40) },
    { path: "new.ts", ...incoming["new.ts"] },
  ]);
});
