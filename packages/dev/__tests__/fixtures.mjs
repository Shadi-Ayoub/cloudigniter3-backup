import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), "cloudigniter-dev-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  async function json(file, value) {
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await writeFile(
      path.join(root, file),
      `${JSON.stringify(value, null, 2)}\n`,
    );
  }
  await json("package.json", { name: "cloudigniter", private: true });
  await writeFile(
    path.join(root, "pnpm-workspace.yaml"),
    'packages:\n  - "packages/*"\n',
  );
  await json(".changeset/config.json", {
    changelog: false,
    commit: false,
    fixed: [],
    linked: [],
    access: "public",
    baseBranch: "main",
    updateInternalDependencies: "patch",
    ignore: [],
  });
  const policy = {
    schemaVersion: 1,
    repository: "cloudigniter/platform",
    baseBranch: "main",
    registry: "https://registry.npmjs.org",
    reviewers: ["release-manager"],
    tags: ["latest", "next", "alpha", "beta", "rc"],
    packages: {
      "@cloudigniter/core": { path: "packages/core", access: "public" },
      "@cloudigniter/next": { path: "packages/next", access: "public" },
      "@cloudigniter/dev": { path: "packages/dev", access: "restricted" },
    },
  };
  await json(".cloudigniter/release-policy.json", policy);
  await json(".cloudigniter/github-policy.json", {
    schemaVersion: 1,
    backupRepository: "owner/backup",
    requesters: ["developer"],
    template: {
      repository: "product/template",
      baseBranch: "main",
      reviewers: ["release-manager"],
    },
  });
  await json("packages/core/package.json", {
    name: "@cloudigniter/core",
    version: "0.1.0",
  });
  await json("packages/next/package.json", {
    name: "@cloudigniter/next",
    version: "0.1.0",
    dependencies: { "@cloudigniter/core": "workspace:^0.1.0" },
  });
  await json("packages/dev/package.json", {
    name: "@cloudigniter/dev",
    version: "0.1.0",
    publishConfig: { access: "restricted" },
  });
  return { root, json, policy };
}
