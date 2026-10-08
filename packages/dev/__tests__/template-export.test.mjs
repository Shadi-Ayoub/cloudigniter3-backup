import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  rmdir,
  symlink,
  writeFile,
} from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import ts from "typescript";
import { builtinModules } from "node:module";
import { ciPlanTemplateExport } from "../src/template-export.mjs";

const bin = path.resolve(import.meta.dirname, "../bin/dev.mjs");
const invoke = (root, args) =>
  spawnSync(process.execPath, [bin, "template", ...args, "--json"], {
    cwd: root,
    encoding: "utf8",
  });

async function fixture(t) {
  const parent = await mkdtemp(path.join(tmpdir(), "ci-template-"));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const root = path.join(parent, "workspace");
  const output = path.join(parent, "export");
  const put = async (file, value) => {
    const target = path.join(root, file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(
      target,
      typeof value === "string" ? value : JSON.stringify(value),
    );
  };
  await put("package.json", {
    name: "cloudigniter",
    private: true,
    packageManager: "pnpm@10.33.0",
  });
  await put("pnpm-workspace.yaml", "packages:\n  - packages/*\n");
  await put("packages/dev/package.json", { name: "@cloudigniter/dev" });
  await put("apps/templates/cloudigniter-next-aws-v1/package.json", {
    name: "@cloudigniter/cloudigniter-next-aws-v1",
    private: true,
    scripts: { dev: "next dev", test: "node ../../internal-test.mjs" },
    dependencies: { next: "^16.2.1" },
    devDependencies: {
      "@cloudigniter/core": "workspace:*",
      "@cloudigniter/cli": "workspace:*",
      "@cloudigniter/config-ts": "workspace:*",
    },
  });
  await put(
    "apps/templates/cloudigniter-next-aws-v1/src/index.ts",
    'export { ciExample } from "@cloudigniter/core/lib";\n',
  );
  await put(
    "apps/templates/cloudigniter-next-aws-v1/next.config.ts",
    'export default { turbopack: { root: "../.." } };\n',
  );
  await put("apps/templates/cloudigniter-next-aws-v1/.env.local", "SECRET=never-export\n");
  await put("apps/templates/cloudigniter-next-aws-v1/amplify_outputs.json", '{"deployment":"private"}');
  await put(".cloudigniter/template/tsconfig.json", {
    compilerOptions: { strict: true },
  });
  const policy = {
    schemaVersion: 1,
    source: "apps/templates/cloudigniter-next-aws-v1",
    name: "cloudigniter-app",
    files: ["package.json", "src/index.ts", "next.config.ts"],
    overlays: { "tsconfig.json": ".cloudigniter/template/tsconfig.json" },
    versions: { "@cloudigniter/core": "0.1.0", "@cloudigniter/cli": "0.1.0" },
    removeDependencies: ["@cloudigniter/config-ts"],
    scripts: { dev: "next dev" },
    replacements: {
      "next.config.ts": [{ from: 'root: "../.."', to: 'root: "."' }],
    },
  };
  const save = () => put(".cloudigniter/template-policy.json", policy);
  await save();
  return { root, output, put, policy, save };
}

test("template export previews and creates a standalone snapshot without private files or workspace dependencies", async (t) => {
  const { root, output } = await fixture(t);
  const preview = invoke(root, ["export", "--output", output, "--dry-run"]);
  assert.equal(preview.status, 0, preview.stderr);
  assert.equal(JSON.parse(preview.stdout).written, false);
  await assert.rejects(access(output));
  const result = invoke(root, ["export", "--output", output]);
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.written, true);
  assert.equal(report.registryVerified, false);
  const pkg = JSON.parse(
    await readFile(path.join(output, "package.json"), "utf8"),
  );
  assert.equal(pkg.dependencies["@cloudigniter/core"], "0.1.0");
  assert.equal(pkg.devDependencies["@cloudigniter/cli"], "0.1.0");
  assert.equal(pkg.devDependencies["@cloudigniter/config-ts"], undefined);
  assert.equal(pkg.scripts.test, undefined);
  assert.equal(pkg.private, true);
  for (const file of [
    ".env.local",
    "amplify_outputs.json",
    ".git",
    "pnpm-workspace.yaml",
  ])
    await assert.rejects(access(path.join(output, file)));
  assert.match(
    await readFile(path.join(output, "next.config.ts"), "utf8"),
    /root: "\."/,
  );
  assert.equal(invoke(root, ["check", "--output", output]).status, 0);
  await writeFile(path.join(output, "src/index.ts"), "changed");
  const changed = invoke(root, ["check", "--output", output]);
  assert.equal(changed.status, 1);
  assert.match(changed.stderr, /src\/index.ts/);
});

test("template export refuses existing destinations and never edits the source", async (t) => {
  const { root, output } = await fixture(t);
  await mkdir(output);
  await writeFile(path.join(output, "keep"), "user content");
  const result = invoke(root, ["export", "--output", output]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /exists/);
  assert.equal(
    await readFile(path.join(output, "keep"), "utf8"),
    "user content",
  );
  assert.match(
    await readFile(path.join(root, "apps/templates/cloudigniter-next-aws-v1/package.json"), "utf8"),
    /workspace:/,
  );
});

test("template publish dry-run verifies the export and previews its configured GitHub destination offline", async (t) => {
  const { root, output, put } = await fixture(t);
  await put(".cloudigniter/github-policy.json", {
    schemaVersion: 1,
    backupRepository: "owner/private-backup",
    requesters: ["developer"],
    template: {
      repository: "product/public-template",
      baseBranch: "main",
      reviewers: ["owner"],
    },
  });
  assert.equal(invoke(root, ["export", "--output", output]).status, 0);
  const result = invoke(root, ["publish", "--output", output, "--dry-run"]);
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.repository, "product/public-template");
  assert.equal(report.published, false);
  assert.equal(report.status, "preview");
  await writeFile(path.join(output, "unexpected.txt"), "not approved");
  const invalid = invoke(root, ["publish", "--output", output, "--dry-run"]);
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /Unexpected export files/);
});

test("template overwrite previews without changes and replaces the complete previous export", async (t) => {
  const { root, output, put } = await fixture(t);
  const args = ["export", "--output", output, "--overwrite"];
  const initial = invoke(root, args);
  assert.equal(initial.status, 0, initial.stderr);
  assert.equal(JSON.parse(initial.stdout).replaced, false);
  await mkdir(path.join(output, "old"));
  await writeFile(path.join(output, "old/.keep"), "previous content");
  await put("apps/templates/cloudigniter-next-aws-v1/src/index.ts", "export const updated = true;\n");
  const before = await readFile(path.join(output, "src/index.ts"));
  const preview = invoke(root, [...args, "--dry-run"]);
  assert.equal(preview.status, 0, preview.stderr);
  assert.equal(JSON.parse(preview.stdout).wouldReplace, true);
  assert.equal(JSON.parse(preview.stdout).replaced, false);
  assert.equal(JSON.parse(preview.stdout).written, false);
  assert.deepEqual(await readFile(path.join(output, "src/index.ts")), before);
  assert.equal(
    await readFile(path.join(output, "old/.keep"), "utf8"),
    "previous content",
  );
  const result = invoke(root, args);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).replaced, true);
  await assert.rejects(access(path.join(output, "old")));
  assert.equal(
    await readFile(path.join(output, "src/index.ts"), "utf8"),
    "export const updated = true;\n",
  );
  assert.equal(invoke(root, ["check", "--output", output]).status, 0);
});

test("template overwrite preserves the destination when source validation fails", async (t) => {
  const { root, output, put } = await fixture(t);
  await mkdir(output);
  await writeFile(path.join(output, "keep"), "user content");
  await put("apps/templates/cloudigniter-next-aws-v1/src/index.ts", 'import "@cloudigniter/dev";');
  const result = invoke(root, ["export", "--output", output, "--overwrite"]);
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /Private|private/);
  assert.equal(
    await readFile(path.join(output, "keep"), "utf8"),
    "user content",
  );
  await assert.rejects(access(path.join(output, "package.json")));
});

test("template overwrite rejects files, linked destinations and protected directories", async (t) => {
  const { root, output } = await fixture(t);
  await writeFile(output, "keep file");
  const file = invoke(root, ["export", "--output", output, "--overwrite"]);
  assert.equal(file.status, 2);
  assert.match(file.stderr, /regular.*directory/);
  assert.equal(await readFile(output, "utf8"), "keep file");
  await rm(output);
  await symlink(path.join(root, "apps/templates/cloudigniter-next-aws-v1"), output);
  const link = invoke(root, ["export", "--output", output, "--overwrite"]);
  assert.equal(link.status, 2);
  assert.match(link.stderr, /regular.*directory/);
  for (const target of [
    root,
    path.join(root, "apps/templates/cloudigniter-next-aws-v1"),
    path.dirname(root),
    path.parse(root).root,
    homedir(),
  ]) {
    const result = invoke(root, [
      "export",
      "--output",
      target,
      "--overwrite",
      "--dry-run",
    ]);
    assert.equal(result.status, 2, target);
    assert.match(result.stderr, /workspace|protected/);
  }
  assert.match(
    await readFile(path.join(root, "apps/templates/cloudigniter-next-aws-v1/package.json"), "utf8"),
    /workspace:/,
  );
});

test("template overwrite protects Git checkouts, nested repositories and worktrees", async (t) => {
  const { root, output } = await fixture(t);
  for (const marker of [".git", "nested/.git"]) {
    await mkdir(path.join(output, marker), { recursive: true });
    await writeFile(path.join(output, marker, "HEAD"), "keep history");
    const result = invoke(root, ["export", "--output", output, "--overwrite"]);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /Git/);
    assert.equal(
      await readFile(path.join(output, marker, "HEAD"), "utf8"),
      "keep history",
    );
    await rm(output, { recursive: true });
  }
  await mkdir(output);
  await writeFile(path.join(output, ".git"), "gitdir: ../worktrees/starter");
  const worktree = invoke(root, ["export", "--output", output, "--overwrite"]);
  assert.equal(worktree.status, 2);
  assert.match(worktree.stderr, /Git/);
  await mkdir(path.join(output, "child"));
  const child = invoke(root, [
    "export",
    "--output",
    path.join(output, "child"),
    "--overwrite",
  ]);
  assert.equal(child.status, 2);
  assert.match(child.stderr, /Git/);
  assert.equal(
    await readFile(path.join(output, ".git"), "utf8"),
    "gitdir: ../worktrees/starter",
  );
});

test("template overwrite unlinks nested symlinks without modifying their targets and is export-only", async (t) => {
  const { root, output } = await fixture(t);
  await mkdir(output);
  await symlink(
    path.join(root, "apps/templates/cloudigniter-next-aws-v1"),
    path.join(output, "linked-source"),
  );
  const check = invoke(root, ["check", "--output", output, "--overwrite"]);
  assert.equal(check.status, 2);
  assert.match(check.stderr, /overwrite/);
  const result = invoke(root, ["export", "--output", output, "--overwrite"]);
  assert.equal(result.status, 0, result.stderr);
  await assert.rejects(access(path.join(output, "linked-source")));
  assert.match(
    await readFile(path.join(root, "apps/templates/cloudigniter-next-aws-v1/package.json"), "utf8"),
    /workspace:/,
  );
});

test("template source can be any named application nested under apps, independent of cwd and export name", async (t) => {
  const { root, output, put } = await fixture(t);
  const source = "apps/starters/Next AWS Starter.v2";
  await mkdir(path.join(root, "apps/starters"));
  await rename(path.join(root, "apps/templates/cloudigniter-next-aws-v1"), path.join(root, source));
  await put(
    `${source}/src/index.ts`,
    "export const selectedTemplate = true;\n",
  );
  const args = [
    "--source",
    source,
    "--name=@example/my.app_2",
    "--output",
    output,
    "--workspace-root",
    root,
  ];
  const cwd = path.join(root, "packages/dev");
  const preview = invoke(cwd, ["export", ...args, "--dry-run"]);
  assert.equal(preview.status, 0, preview.stderr);
  assert.equal(JSON.parse(preview.stdout).source, source);
  assert.equal(JSON.parse(preview.stdout).name, "@example/my.app_2");
  await assert.rejects(access(output));
  const result = invoke(cwd, ["export", ...args]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    await readFile(path.join(output, "src/index.ts"), "utf8"),
    "export const selectedTemplate = true;\n",
  );
  const pkg = JSON.parse(
    await readFile(path.join(output, "package.json"), "utf8"),
  );
  assert.equal(pkg.name, "@example/my.app_2");
  assert.equal(invoke(cwd, ["check", ...args]).status, 0);
  const changedName = invoke(cwd, [
    "check",
    "--source",
    source,
    "--output",
    output,
    "--workspace-root",
    root,
  ]);
  assert.equal(changedName.status, 1);
  assert.match(changedName.stderr, /package.json/);
});

test("templates can select independent export policies without changing the workspace default", async (t) => {
  const { root, output, put, policy } = await fixture(t);
  const originalPolicy = await readFile(
    path.join(root, ".cloudigniter/template-policy.json"),
    "utf8",
  );
  const source = "apps/products/storefront";
  await mkdir(path.join(root, "apps/products"));
  await rename(path.join(root, "apps/templates/cloudigniter-next-aws-v1"), path.join(root, source));
  const policyFile = ".cloudigniter/templates/storefront.json";
  await put(`${source}/public/about.txt`, "Storefront application\n");
  await put(policyFile, {
    ...policy,
    source,
    name: "storefront.v2",
    files: [...policy.files, "public/about.txt"],
    versions: { "@cloudigniter/core": "0.2.0", "@cloudigniter/cli": "0.1.1" },
  });
  const args = ["--policy", policyFile, "--output", output];
  const result = invoke(root, ["export", ...args]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).policy, policyFile);
  assert.equal(JSON.parse(result.stdout).source, source);
  const pkg = JSON.parse(
    await readFile(path.join(output, "package.json"), "utf8"),
  );
  assert.equal(pkg.name, "storefront.v2");
  assert.equal(pkg.dependencies["@cloudigniter/core"], "0.2.0");
  assert.equal(
    await readFile(path.join(output, "public/about.txt"), "utf8"),
    "Storefront application\n",
  );
  assert.equal(invoke(root, ["check", ...args]).status, 0);
  assert.equal(
    await readFile(
      path.join(root, ".cloudigniter/template-policy.json"),
      "utf8",
    ),
    originalPolicy,
  );
});

test("source selection rejects paths outside apps, traversal and directory symlinks before export", async (t) => {
  const { root, output } = await fixture(t);
  await symlink(
    path.join(root, "apps/templates/cloudigniter-next-aws-v1"),
    path.join(root, "apps/linked"),
  );
  await symlink(path.join(root, "apps"), path.join(root, "apps/aliased"));
  for (const source of [
    "apps",
    "packages/dev",
    "../apps/templates/cloudigniter-next-aws-v1",
    "apps/../packages/dev",
    path.join(root, "apps/templates/cloudigniter-next-aws-v1"),
    "apps/linked",
    "apps/aliased/template",
  ]) {
    const result = invoke(root, [
      "export",
      "--source",
      source,
      "--output",
      output,
    ]);
    assert.equal(result.status, 2, result.stderr);
    assert.match(result.stderr, /apps|relative|symlink/);
    await assert.rejects(access(output));
  }
  for (const args of [
    ["--policy=../outside.json"],
    ["--policy=/tmp/policy.json"],
    ["--name=Invalid Name"],
    ["--name=@broken"],
    ["--name=../escape"],
  ]) {
    const result = invoke(root, ["export", "--output", output, ...args]);
    assert.equal(result.status, 2, result.stderr);
    await assert.rejects(access(output));
  }
  const inside = invoke(root, [
    "export",
    "--source=apps/templates/cloudigniter-next-aws-v1",
    "--output",
    path.join(root, "apps/public-candidate"),
  ]);
  assert.equal(inside.status, 2);
  assert.match(inside.stderr, /outside the private workspace/);
});

test("policy source defaults accept renamed applications and enforce apps confinement", async (t) => {
  const { root, output, policy, save } = await fixture(t);
  await rename(
    path.join(root, "apps/templates/cloudigniter-next-aws-v1"),
    path.join(root, "apps/my-starter"),
  );
  policy.source = "apps/my-starter";
  policy.name = "@company/my-starter";
  await save();
  const result = invoke(root, ["export", "--output", output, "--dry-run"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).name, policy.name);
  policy.source = "packages/dev";
  await save();
  const denied = invoke(root, ["export", "--output", output]);
  assert.equal(denied.status, 2);
  assert.match(denied.stderr, /apps/);
  await assert.rejects(access(output));
});

test("template selection requires a real application even when every file is overlaid", async (t) => {
  const { root, output, policy, save } = await fixture(t);
  for (const file of policy.files)
    policy.overlays[file] = `apps/templates/cloudigniter-next-aws-v1/${file}`;
  policy.files = [];
  policy.source = "apps/empty";
  await mkdir(path.join(root, policy.source));
  await save();
  const absent = invoke(root, ["export", "--output", output]);
  assert.notEqual(absent.status, 0);
  assert.match(absent.stderr, /apps\/empty\/package.json/);
  await assert.rejects(access(output));
  await rmdir(path.join(root, policy.source));
  await symlink(
    path.join(root, "apps/templates/cloudigniter-next-aws-v1"),
    path.join(root, policy.source),
  );
  const linked = invoke(root, ["export", "--output", output]);
  assert.equal(linked.status, 2);
  assert.match(linked.stderr, /symlink/);
  await assert.rejects(access(output));
});

test("template export rejects source links, private dependencies, escaping paths and stale rewrites before writing", async (t) => {
  for (const kind of [
    "symlink",
    "escape",
    "private",
    "rewrite",
    "secret",
    "local-dependency",
  ]) {
    const { root, output, put, policy, save } = await fixture(t);
    if (kind === "symlink") {
      await rm(path.join(root, "apps/templates/cloudigniter-next-aws-v1/src/index.ts"));
      await symlink(
        path.join(root, "package.json"),
        path.join(root, "apps/templates/cloudigniter-next-aws-v1/src/index.ts"),
      );
    }
    if (kind === "escape") policy.files.push("../company.json");
    if (kind === "private")
      await put("apps/templates/cloudigniter-next-aws-v1/src/index.ts", 'import "@cloudigniter/dev";');
    if (kind === "rewrite")
      policy.replacements["next.config.ts"][0].from = "stale-pattern";
    if (kind === "secret") policy.files.push(".env.local");
    if (kind === "local-dependency")
      await put("apps/templates/cloudigniter-next-aws-v1/package.json", {
        dependencies: { example: "file:../../secret" },
      });
    await save();
    const result = invoke(root, ["export", "--output", output]);
    assert.notEqual(result.status, 0, kind);
    await assert.rejects(access(output));
  }
});

test("template command rejects invalid flags and in-workspace destinations", async (t) => {
  const { root, output } = await fixture(t);
  for (const args of [
    ["upload", "--output", output],
    ["export"],
    ["export", "--output", output, "--tag=latest"],
    ["check", "--output", output, "--dry-run"],
    ["export", "extra", "--output", output],
    ["export", "--output", root],
    ["export", "--output", path.join(root, "exports")],
    ["export", "--output", output, "--package-version=latest"],
  ])
    assert.equal(invoke(root, args).status, 2, args.join(" "));
});

test("template check rejects extra files and explicit version overrides remain deterministic", async (t) => {
  const { root, output } = await fixture(t);
  const args = ["--output", output, "--package-version=0.2.0-beta.1"];
  const result = invoke(root, ["export", ...args]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(invoke(root, ["check", ...args]).status, 0);
  assert.equal(invoke(root, ["check", "--output", output]).status, 1);
  await writeFile(path.join(output, ".env"), "PRIVATE=yes");
  const extra = invoke(root, ["check", ...args]);
  assert.equal(extra.status, 1);
  assert.match(extra.stderr, /\.env/);
});

test("template export preserves reviewed third-party dependency pins and patch assets", async (t) => {
  const { root, output, put, policy, save } = await fixture(t);
  policy.dependencyVersions = { next: "16.2.2" };
  policy.overlays["patches/next.patch"] = ".cloudigniter/template/next.patch";
  policy.overlays["pnpm-workspace.yaml"] =
    ".cloudigniter/template/pnpm-workspace.yaml";
  await put(".cloudigniter/template/next.patch", "reviewed patch\n");
  await put(
    ".cloudigniter/template/pnpm-workspace.yaml",
    "patchedDependencies:\n  next@16.2.2: patches/next.patch\n",
  );
  await save();
  const result = invoke(root, ["export", "--output", output]);
  assert.equal(result.status, 0, result.stderr);
  const pkg = JSON.parse(
    await readFile(path.join(output, "package.json"), "utf8"),
  );
  assert.equal(pkg.dependencies.next, "16.2.2");
  assert.equal(
    await readFile(path.join(output, "patches/next.patch"), "utf8"),
    "reviewed patch\n",
  );
});

test("help describes template export, review boundary, version selection and dry-run", () => {
  for (const flag of ["-h", "--help"]) {
    const result = spawnSync(process.execPath, [bin, flag], {
      cwd: tmpdir(),
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    for (const text of [
      "template export",
      "template check",
      "template publish",
      "template deliver",
      "github check",
      "npm candidate",
      "npm stage",
      "--package-version",
      "--source",
      "--policy",
      "--name",
      "--dry-run",
      "--overwrite",
      "push to GitHub",
    ])
      assert.ok(result.stdout.includes(text), text);
  }
});

test("export rejects symlinked source directories, overlay escapes, case and file/directory collisions", async (t) => {
  for (const kind of [
    "directory-link",
    "overlay-escape",
    "case",
    "parent-file",
    "credential",
  ]) {
    const { root, output, put, policy, save } = await fixture(t);
    if (kind === "directory-link") {
      await mkdir(path.join(root, "outside"));
      await put("outside/index.ts", "export {};\n");
      await rm(path.join(root, "apps/templates/cloudigniter-next-aws-v1/src"), { recursive: true });
      await symlink(
        path.join(root, "outside"),
        path.join(root, "apps/templates/cloudigniter-next-aws-v1/src"),
      );
    }
    if (kind === "overlay-escape")
      policy.overlays["tsconfig.json"] = "../company.json";
    if (kind === "case") {
      policy.files.push("SRC/index.ts");
      await put("apps/templates/cloudigniter-next-aws-v1/SRC/index.ts", "export {};\n");
    }
    if (kind === "parent-file")
      policy.overlays.src = ".cloudigniter/template/tsconfig.json";
    if (kind === "credential")
      await put(
        "apps/templates/cloudigniter-next-aws-v1/src/index.ts",
        'const key = "AKIA' + "A".repeat(16) + '";',
      );
    await save();
    const result = invoke(root, ["export", "--output", output]);
    assert.equal(result.status, 2, result.stderr);
    await assert.rejects(access(output));
  }
});

test("company template policy exports only self-contained application imports and public dependencies", async () => {
  const root = path.resolve(import.meta.dirname, "../../..");
  const plan = await ciPlanTemplateExport(root);
  const pkg = JSON.parse(plan.files.get("package.json").toString());
  const missing = [];
  for (const [file, bytes] of plan.files) {
    assert.doesNotMatch(
      file,
      /(?:^|\/)(?:__tests__|__fixtures__|old_delete|\.env|root-user\.json|config\.json)(?:\/|$)/,
    );
    if (!/\.[cm]?[jt]sx?$/.test(file)) continue;
    const source = ts.createSourceFile(
      file,
      bytes.toString(),
      ts.ScriptTarget.Latest,
      true,
    );
    function visit(node) {
      const specifier =
        ts.isImportDeclaration(node) || ts.isExportDeclaration(node)
          ? node.moduleSpecifier
          : undefined;
      if (specifier && ts.isStringLiteral(specifier)) {
        const name = specifier.text;
        if (name.startsWith(".") || name.startsWith("@/")) {
          const target = path.posix.normalize(
            name.startsWith("@/")
              ? `src/${name.slice(2)}`
              : path.posix.join(path.posix.dirname(file), name),
          );
          const candidates = [
            target,
            target.replace(/\.js$/, ".ts"),
            ...[
              ".ts",
              ".tsx",
              ".mts",
              ".js",
              ".mjs",
              ".json",
              ".d.ts",
              "/index.ts",
              "/index.tsx",
              "/index.mts",
            ].map((suffix) => target + suffix),
          ];
          if (
            target !== "amplify_outputs.json" &&
            !target.startsWith(".amplify/") &&
            !candidates.some((candidate) => plan.files.has(candidate))
          )
            missing.push(`${file}: ${name}`);
        } else if (
          !name.startsWith("node:") &&
          !name.startsWith("$amplify/") &&
          !builtinModules.includes(name)
        ) {
          const dependency = name.startsWith("@")
            ? name.split("/").slice(0, 2).join("/")
            : name.split("/")[0];
          if (!pkg.dependencies[dependency] && !pkg.devDependencies[dependency])
            missing.push(`${file}: undeclared ${dependency}`);
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  assert.deepEqual(missing, []);
  assert.equal(pkg.dependencies.next, "16.2.2");
  assert.ok(plan.files.has("patches/next@16.2.2.patch"));
  assert.ok(
    JSON.parse(
      plan.files.get("src/custom/dev/seeder/data/users/users.json"),
    ).every((user) => user.email.endsWith("@example.com")),
  );
});
