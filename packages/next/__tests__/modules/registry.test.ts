import assert from "node:assert/strict";
import test from "node:test";
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { ciGenerateNextExtensionRegistry } from "../../src/tooling/modules";
import { ciCreateNextExtensionClient } from "../../src/server/modules/ci-create-next-extension-client";
import type { CiExtensionManifest } from "@cloudigniter/core/types";
import type { CiNextExtensionClientOptions } from "../../src/types";

const manifest: CiExtensionManifest = {
  schemaVersion: 1,
  kind: "extension",
  id: "todo",
  name: "Tasks",
  version: "1.0.0",
  runtime: { client: true, server: true },
  target: { framework: "next", clouds: ["aws"] },
  dashboard: { title: "Tasks" },
};
async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "ci-modules-"));
  const modules = path.join(root, "src/custom/modules");
  await mkdir(path.join(modules, "todo/client"), { recursive: true });
  await mkdir(path.join(modules, "todo/server/aws"), { recursive: true });
  await writeFile(
    path.join(modules, "todo/manifest.ts"),
    `export const ciModuleManifest = ${JSON.stringify(manifest)};`,
  );
  await writeFile(
    path.join(modules, "todo/client/index.ts"),
    "export const CiModulePage = () => null;",
  );
  await writeFile(
    path.join(modules, "todo/server/aws/index.ts"),
    "export const ciModuleBackend = {};",
  );
  return {
    root,
    modules,
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}
test("local discovery emits separate deterministic client, metadata and AWS registries", async () => {
  const f = await fixture();
  try {
    await ciGenerateNextExtensionRegistry(f.root);
    const client = await readFile(
      path.join(f.modules, ".generated/client.ts"),
      "utf8",
    );
    assert.match(client, /use client/);
    assert.match(client, /todo\/client/);
    assert.doesNotMatch(client, /server\/aws|node:|cloudformation/);
    assert.match(
      await readFile(path.join(f.modules, ".generated/aws.ts"), "utf8"),
      /todo\/server\/aws/,
    );
    await ciGenerateNextExtensionRegistry(f.root);
    assert.equal(
      await readFile(path.join(f.modules, ".generated/client.ts"), "utf8"),
      client,
    );
  } finally {
    await f.cleanup();
  }
});
test("registry generation refuses manual targets and module symlinks", async () => {
  const f = await fixture();
  try {
    await mkdir(path.join(f.modules, ".generated"));
    await writeFile(path.join(f.modules, ".generated/aws.ts"), "manual file");
    await assert.rejects(
      () => ciGenerateNextExtensionRegistry(f.root),
      /manual module registry/,
    );
    assert.equal(
      await readFile(path.join(f.modules, ".generated/aws.ts"), "utf8"),
      "manual file",
    );
    await symlink(path.join(f.modules, "todo"), path.join(f.modules, "escape"));
    await assert.rejects(
      () => ciGenerateNextExtensionRegistry(f.root),
      /Unexpected module entry/,
    );
  } finally {
    await f.cleanup();
  }
});
test("incompatible modules remain discoverable without importing unsupported facets", async () => {
  const f = await fixture();
  try {
    await mkdir(path.join(f.modules, "other"));
    await writeFile(
      path.join(f.modules, "other/manifest.ts"),
      `export const ciModuleManifest = ${JSON.stringify({ ...manifest, id: "other", target: { framework: "other" } })};`,
    );
    await ciGenerateNextExtensionRegistry(f.root);
    assert.match(
      await readFile(path.join(f.modules, ".generated/manifests.ts"), "utf8"),
      /other\/manifest/,
    );
    assert.doesNotMatch(
      await readFile(path.join(f.modules, ".generated/aws.ts"), "utf8"),
      /other\/server/,
    );
  } finally {
    await f.cleanup();
  }
});
test("a missing required facet stops generation before any outputs change", async () => {
  const f = await fixture();
  try {
    await rm(path.join(f.modules, "todo/server/aws/index.ts"));
    await assert.rejects(
      () => ciGenerateNextExtensionRegistry(f.root),
      /ENOENT/,
    );
    await assert.rejects(
      () => readFile(path.join(f.modules, ".generated/manifests.ts")),
      /ENOENT/,
    );
  } finally {
    await f.cleanup();
  }
});
const context: CiNextExtensionClientOptions["context"] = {
  env: { mode: "development" },
  auth: {
    mode: "userPool",
    user: {
      id: "developer",
      authenticated: true,
      roles: ["developer"],
      primaryRole: "developer",
    },
  },
};
test("the Next boundary requires the developer gate before invoking provider mutations", async () => {
  let called = false;
  const client = ciCreateNextExtensionClient({
    context: { ...context, env: { mode: "production" } },
    manifests: [manifest],
    host: { framework: "next", cloud: "aws" },
    operations: {
      manage: async () => {
        called = true;
        return { data: null };
      },
    },
  });
  assert.equal(
    (await client.command({ id: "todo", action: "install", revision: 0 })).ok,
    false,
  );
  assert.equal(called, false);
});
test("the Next catalogue reports new folders awaiting backend deployment and retains missing installed modules", async () => {
  const client = ciCreateNextExtensionClient({
    context,
    manifests: [manifest],
    host: { framework: "next", cloud: "aws" },
    operations: {
      manage: async () => ({
        data: JSON.stringify({
          ok: true,
          statusCode: 200,
          body: {
            revision: 1,
            entries: [
              {
                manifest: { ...manifest, id: "removed" },
                detected: true,
                compatible: true,
              },
            ],
          },
        }),
      }),
    },
  });
  const result = await client.list();
  assert.ok(result.ok);
  assert.equal(
    result.body.entries.find((entry) => entry.manifest.id === "todo")!
      .backendAvailable,
    false,
  );
  assert.equal(
    result.body.entries.find((entry) => entry.manifest.id === "removed")!
      .detected,
    false,
  );
});

test("client-only modules generate no provider-code imports and an empty catalogue is valid", async () => {
  const f = await fixture();
  try {
    await rm(path.join(f.modules, "todo"), { recursive: true });
    await mkdir(path.join(f.modules, "widget/client"), { recursive: true });
    await writeFile(
      path.join(f.modules, "widget/manifest.ts"),
      `export const ciModuleManifest = ${JSON.stringify({ ...manifest, id: "widget", runtime: { client: true, server: false } })};`,
    );
    await writeFile(
      path.join(f.modules, "widget/client/index.ts"),
      "export const CiModulePage = () => null;",
    );
    await ciGenerateNextExtensionRegistry(f.root);
    const generated = await readFile(
      path.join(f.modules, ".generated/aws.ts"),
      "utf8",
    );
    assert.match(generated, /manifest: manifest0/);
    assert.doesNotMatch(generated, /server\/aws/);
    await rm(path.join(f.modules, "widget"), { recursive: true });
    await ciGenerateNextExtensionRegistry(f.root);
    assert.match(
      await readFile(path.join(f.modules, ".generated/manifests.ts"), "utf8"),
      /extensionManifests = \[\]/,
    );
  } finally {
    await f.cleanup();
  }
});
