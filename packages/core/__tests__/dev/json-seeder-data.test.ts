import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { ciReadJsonSeederData } from "../../src/server/dev/seeder";

const definition = {
  id: "test-tenants",
  title: "Test tenants",
  resource: "platform.tenants",
  dataDirectory: "data/tenants",
  dataFiles: ["one.json", "two.json"],
  createApi: "SeedTenants",
  cleanupApi: "CleanupSeededTenants",
} as const;

test("reads declared JSON arrays in order", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "ci-seeder-"));
  const dataRoot = path.join(root, "src/custom/dev/seeder/data/tenants");
  await mkdir(dataRoot, { recursive: true });
  await writeFile(path.join(dataRoot, "one.json"), '[{"id":"one"}]');
  await writeFile(path.join(dataRoot, "two.json"), '[{"id":"two"}]');

  assert.deepEqual(await ciReadJsonSeederData({ appRoot: root, definition }), [
    { id: "one" },
    { id: "two" },
  ]);
});

test("rejects paths that escape the custom seeder root", async () => {
  await assert.rejects(
    ciReadJsonSeederData({
      definition: { ...definition, dataDirectory: "../../../../outside" },
    }),
    /inside the configured seeder root/,
  );
});
