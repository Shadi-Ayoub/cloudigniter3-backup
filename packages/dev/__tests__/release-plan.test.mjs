import test from "node:test";
import assert from "node:assert/strict";
import { ciCreateReleasePlan } from "../src/release-plan.mjs";
import { fixture } from "./fixtures.mjs";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ciReadPolicy, ciFindWorkspace } from "../src/policy.mjs";

const core = {
  packages: ["@cloudigniter/core"],
  summary: "Fix request handling.",
};

test("a fix proposes a patch release without writing package versions", async (t) => {
  const { root } = await fixture(t);
  const plan = await ciCreateReleasePlan(root, {
    intent: "fix",
    packages: ["@cloudigniter/core"],
    summary: "Fix request handling.",
  });
  assert.equal(
    plan.releases.find((release) => release.name === "@cloudigniter/core")
      ?.newVersion,
    "0.1.1",
  );
  assert.equal(
    JSON.parse(
      await readFile(path.join(root, "packages/core/package.json"), "utf8"),
    ).version,
    "0.1.0",
  );
  assert.deepEqual(await readdir(path.join(root, ".changeset")), [
    "config.json",
  ]);
});

for (const [intent, version] of [
  ["patch", "0.1.1"],
  ["feature", "0.2.0"],
  ["minor", "0.2.0"],
  ["breaking", "0.2.0"],
  ["major", "1.0.0"],
]) {
  test(`${intent} follows the documented version policy`, async (t) => {
    const { root } = await fixture(t);
    const plan = await ciCreateReleasePlan(root, { ...core, intent });
    assert.equal(
      plan.releases.find((item) => item.name === "@cloudigniter/core")
        .newVersion,
      version,
    );
  });
}

test("breaking changes after 1.0 increment major", async (t) => {
  const { root, json } = await fixture(t);
  await json("packages/core/package.json", {
    name: "@cloudigniter/core",
    version: "1.4.2",
  });
  await json("packages/next/package.json", {
    name: "@cloudigniter/next",
    version: "0.1.0",
    dependencies: { "@cloudigniter/core": "workspace:^1.4.2" },
  });
  const plan = await ciCreateReleasePlan(root, { ...core, intent: "breaking" });
  assert.equal(
    plan.releases.find((item) => item.name === "@cloudigniter/core").newVersion,
    "2.0.0",
  );
});

test("feature releases propagate dependency updates through Changesets", async (t) => {
  const { root } = await fixture(t);
  const plan = await ciCreateReleasePlan(root, { ...core, intent: "feature" });
  assert.deepEqual(
    plan.releases.find((item) => item.name === "@cloudigniter/next"),
    {
      name: "@cloudigniter/next",
      path: "packages/next",
      type: "patch",
      oldVersion: "0.1.0",
      newVersion: "0.1.1",
      access: "public",
      reason: "dependency",
    },
  );
});

test("initial targets 0.1.0 but does not silently reset existing versions", async (t) => {
  const { root, json } = await fixture(t);
  await json("packages/core/package.json", {
    name: "@cloudigniter/core",
    version: "0.0.1",
  });
  await json("packages/next/package.json", {
    name: "@cloudigniter/next",
    version: "0.1.0",
    dependencies: { "@cloudigniter/core": "workspace:^" },
  });
  const plan = await ciCreateReleasePlan(root, { ...core, intent: "initial" });
  assert.equal(
    plan.releases.find((item) => item.name === "@cloudigniter/core").newVersion,
    "0.1.0",
  );
  await json("packages/core/package.json", {
    name: "@cloudigniter/core",
    version: "0.1.0",
  });
  await assert.rejects(
    ciCreateReleasePlan(root, { ...core, intent: "initial" }),
    /initial only/,
  );
});

test("prereleases use Changesets numbering and never move latest", async (t) => {
  const { root } = await fixture(t);
  const plan = await ciCreateReleasePlan(root, {
    ...core,
    intent: "feature",
    preid: "beta",
  });
  assert.equal(plan.tag, "beta");
  assert.equal(
    plan.releases.find((item) => item.name === "@cloudigniter/core").newVersion,
    "0.2.0-beta.0",
  );
  assert.deepEqual(plan.enterPreState.changesets, []);
  assert.deepEqual(await readdir(path.join(root, ".changeset")), [
    "config.json",
  ]);
  await assert.rejects(
    ciCreateReleasePlan(root, {
      ...core,
      intent: "feature",
      preid: "beta",
      tag: "latest",
    }),
    /cannot use the latest/,
  );
});

test("an existing prerelease cycle is honored and incompatible cycles fail", async (t) => {
  const { root, json } = await fixture(t);
  await json(".changeset/pre.json", {
    mode: "pre",
    tag: "beta",
    initialVersions: {
      "@cloudigniter/core": "0.1.0",
      "@cloudigniter/next": "0.1.0",
      "@cloudigniter/dev": "0.1.0",
    },
    changesets: [],
  });
  const plan = await ciCreateReleasePlan(root, { ...core, intent: "fix" });
  assert.equal(plan.tag, "beta");
  assert.equal(plan.enterPreState, null);
  await assert.rejects(
    ciCreateReleasePlan(root, { ...core, intent: "fix", preid: "rc" }),
    /different Changesets prerelease/,
  );
});

test("--changed consumes existing Changesets and new intent respects their highest bump", async (t) => {
  const { root } = await fixture(t);
  await writeFile(
    path.join(root, ".changeset/existing.md"),
    '---\n"@cloudigniter/core": minor\n---\n\nAdd an API.\n',
  );
  const changed = await ciCreateReleasePlan(root, { changed: true });
  assert.equal(changed.newChangeset, null);
  assert.equal(
    changed.releases.find((item) => item.name === "@cloudigniter/core")
      .newVersion,
    "0.2.0",
  );
  const combined = await ciCreateReleasePlan(root, { ...core, intent: "fix" });
  assert.equal(
    combined.releases.find((item) => item.name === "@cloudigniter/core")
      .newVersion,
    "0.2.0",
  );
  assert.ok(
    combined.warnings.some((item) => item.includes("all pending Changesets")),
  );
});

test("private registry packages are publishable but private:true is not", async (t) => {
  const { root, json } = await fixture(t);
  const options = {
    intent: "fix",
    packages: ["@cloudigniter/dev"],
    access: "private",
  };
  assert.equal(
    (await ciCreateReleasePlan(root, options)).releases[0].access,
    "restricted",
  );
  await assert.rejects(
    ciCreateReleasePlan(root, { ...options, access: "public" }),
    /conflicts with approved/,
  );
  await json("packages/dev/package.json", {
    name: "@cloudigniter/dev",
    version: "0.1.0",
    private: true,
  });
  await assert.rejects(ciCreateReleasePlan(root, options), /private:true/);
});

test("dependency propagation cannot escape the approved package list", async (t) => {
  const { root, json, policy } = await fixture(t);
  delete policy.packages["@cloudigniter/next"];
  await json(".cloudigniter/release-policy.json", policy);
  await assert.rejects(
    ciCreateReleasePlan(root, { ...core, intent: "feature" }),
    /Dependency propagation includes @cloudigniter\/next/,
  );
});

for (const [name, options, pattern] of [
  [
    "unknown package",
    { intent: "fix", packages: ["@other/core"] },
    /not allowed/,
  ],
  ["missing selection", { intent: "fix" }, /at least one/],
  ["unknown bump", { ...core, intent: "force" }, /Unknown release intent/],
  ["empty changesets", { changed: true }, /No pending Changesets/],
  [
    "conflicting selection",
    { ...core, intent: "fix", changed: true },
    /do not combine/,
  ],
  ["unapproved tag", { ...core, intent: "fix", tag: "secret" }, /not allowed/],
  [
    "invalid preid",
    { ...core, intent: "fix", preid: "latest" },
    /allowed prerelease/,
  ],
  [
    "terminal escape",
    { ...core, intent: "fix", summary: "\u001b[2J" },
    /control characters/,
  ],
]) {
  test(`rejects ${name}`, async (t) => {
    const { root } = await fixture(t);
    await assert.rejects(ciCreateReleasePlan(root, options), pattern);
  });
}

test("manifest publishing configuration must match policy", async (t) => {
  const { root, json } = await fixture(t);
  await json("packages/core/package.json", {
    name: "@cloudigniter/core",
    version: "0.1.0",
    publishConfig: { registry: "https://example.com" },
  });
  await assert.rejects(
    ciCreateReleasePlan(root, { ...core, intent: "fix" }),
    /publishConfig conflicts/,
  );
});

test("policy rejects public dev, path traversal, unknown keys and semver tags", async (t) => {
  const { root, json, policy } = await fixture(t);
  for (const invalid of [
    {
      ...policy,
      packages: {
        "@cloudigniter/dev": { path: "packages/dev", access: "public" },
      },
    },
    {
      ...policy,
      packages: {
        "@cloudigniter/core": { path: "../../elsewhere", access: "public" },
      },
    },
    { ...policy, skipApproval: true },
    { ...policy, tags: ["latest", "v1"] },
  ]) {
    await json(".cloudigniter/release-policy.json", invalid);
    await assert.rejects(ciReadPolicy(root));
  }
});

test("workspace discovery works from a package and rejects an unrelated pnpm workspace", async (t) => {
  const { root, json } = await fixture(t);
  assert.ok(
    (await ciFindWorkspace(path.join(root, "packages/core"))).endsWith(
      path.basename(root),
    ),
  );
  await json("package.json", { name: "another-project", private: true });
  await assert.rejects(ciFindWorkspace(root), /private cloudigniter/);
});
