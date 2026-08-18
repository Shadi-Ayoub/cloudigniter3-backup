import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  access,
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  stat,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  ciApplyResourceFileTransaction,
  ciCreateResourceFileTransaction,
  ciReadResourceFileTransaction,
  ciRollbackResourceFileTransaction,
  ciRunResourceFileTransaction,
} from "../src/runtime/ci-resource-file-transaction.mjs";

async function ciCreateTestApplication(t) {
  const applicationRoot = await mkdtemp(
    path.join(os.tmpdir(), "ci-resource-transaction-"),
  );
  t.after(() => rm(applicationRoot, { force: true, recursive: true }));
  return applicationRoot;
}

async function ciPathExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function ciSha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

test("applies and rolls back exact bytes, existence, modes, and created directories", async (t) => {
  const applicationRoot = await ciCreateTestApplication(t);
  const existingDirectory = path.join(applicationRoot, "amplify/custom");
  await mkdir(existingDirectory, { recursive: true });

  const registryPath = path.join(existingDirectory, "registry.generated.ts");
  const deletedPath = path.join(existingDirectory, "legacy.bin");
  const beforeRegistry = Buffer.from([0x00, 0x43, 0x49, 0xff, 0x0a]);
  const afterRegistry = Buffer.from("export const resources = ['book'];\n");
  const deletedBytes = Buffer.from([0xde, 0xad, 0xbe, 0xef]);
  await writeFile(registryPath, beforeRegistry);
  await chmod(registryPath, 0o640);
  await writeFile(deletedPath, deletedBytes);
  await chmod(deletedPath, 0o600);

  const prepared = await ciCreateResourceFileTransaction({
    applicationRoot,
    transactionId: "book-create",
    metadata: { resourceId: "application:data-entity:book" },
    changes: [
      {
        path: "amplify/custom/registry.generated.ts",
        content: afterRegistry,
        mode: 0o644,
      },
      { path: "amplify/custom/legacy.bin", delete: true },
      {
        path: "src/custom/resources/book/adapter.generated.ts",
        content: "export const bookAdapter = {};\n",
        mode: 0o600,
      },
    ],
  });

  assert.equal(prepared.status, "prepared");
  assert.equal(
    prepared.journalPath,
    path.join(
      await realpath(applicationRoot),
      ".cloudigniter/local/resource-studio/transactions/book-create/transaction.json",
    ),
  );
  assert.deepEqual(prepared.plannedCreatedDirectories, [
    "src",
    "src/custom",
    "src/custom/resources",
    "src/custom/resources/book",
  ]);

  const registryEntry = prepared.files.find(
    (entry) => entry.path === "amplify/custom/registry.generated.ts",
  );
  assert.deepEqual(registryEntry.before, {
    kind: "file",
    mode: 0o640,
    sha256: ciSha256(beforeRegistry),
    size: beforeRegistry.byteLength,
  });
  assert.deepEqual(registryEntry.after, {
    kind: "file",
    mode: 0o644,
    sha256: ciSha256(afterRegistry),
    size: afterRegistry.byteLength,
  });

  const applied = await ciApplyResourceFileTransaction({
    applicationRoot,
    transactionId: "book-create",
  });
  assert.equal(applied.status, "applied");
  assert.deepEqual(await readFile(registryPath), afterRegistry);
  assert.equal((await stat(registryPath)).mode & 0o7777, 0o644);
  assert.equal(await ciPathExists(deletedPath), false);
  assert.equal(
    (
      await stat(
        path.join(
          applicationRoot,
          "src/custom/resources/book/adapter.generated.ts",
        ),
      )
    ).mode & 0o7777,
    0o600,
  );

  const rolledBack = await ciRollbackResourceFileTransaction({
    applicationRoot,
    transactionId: "book-create",
  });
  assert.equal(rolledBack.status, "rolled-back");
  assert.deepEqual(await readFile(registryPath), beforeRegistry);
  assert.equal((await stat(registryPath)).mode & 0o7777, 0o640);
  assert.deepEqual(await readFile(deletedPath), deletedBytes);
  assert.equal((await stat(deletedPath)).mode & 0o7777, 0o600);
  assert.equal(await ciPathExists(path.join(applicationRoot, "src")), false);

  const persisted = await ciReadResourceFileTransaction({
    applicationRoot,
    transactionId: "book-create",
  });
  assert.equal(persisted.status, "rolled-back");
  assert.deepEqual(persisted.metadata, {
    resourceId: "application:data-entity:book",
  });
});

test("refuses traversal, absolute paths, journal writes, and symlink traversal", async (t) => {
  const applicationRoot = await ciCreateTestApplication(t);
  const outsideRoot = await mkdtemp(
    path.join(os.tmpdir(), "ci-resource-transaction-outside-"),
  );
  t.after(() => rm(outsideRoot, { force: true, recursive: true }));
  await writeFile(path.join(outsideRoot, "outside.txt"), "outside\n");
  await symlink(outsideRoot, path.join(applicationRoot, "linked"));

  for (const unsafePath of [
    "../outside.txt",
    path.join(outsideRoot, "outside.txt"),
    ".cloudigniter/local/resource-studio/transactions/manual.txt",
    ".git/config",
  ]) {
    await assert.rejects(
      ciCreateResourceFileTransaction({
        applicationRoot,
        changes: [{ path: unsafePath, content: "unsafe\n" }],
      }),
      (error) =>
        error.code === "CI_RESOURCE_FILE_PATH_OUTSIDE_ROOT" ||
        error.code === "CI_RESOURCE_FILE_PROTECTED_PATH",
    );
  }

  await assert.rejects(
    ciCreateResourceFileTransaction({
      applicationRoot,
      changes: [{ path: "linked/outside.txt", content: "unsafe\n" }],
    }),
    { code: "CI_RESOURCE_FILE_SYMLINK_PATH" },
  );
  assert.equal(
    await readFile(path.join(outsideRoot, "outside.txt"), "utf8"),
    "outside\n",
  );
});

test("detects apply drift before mutating any transaction target", async (t) => {
  const applicationRoot = await ciCreateTestApplication(t);
  await writeFile(path.join(applicationRoot, "first.txt"), "first-before\n");
  await writeFile(path.join(applicationRoot, "second.txt"), "second-before\n");

  await ciCreateResourceFileTransaction({
    applicationRoot,
    transactionId: "apply-drift",
    changes: [
      { path: "first.txt", content: "first-after\n" },
      { path: "second.txt", content: "second-after\n" },
    ],
  });
  await writeFile(path.join(applicationRoot, "second.txt"), "developer-edit\n");

  const result = await ciApplyResourceFileTransaction({
    applicationRoot,
    transactionId: "apply-drift",
  });
  assert.equal(result.status, "conflicted");
  assert.deepEqual(
    result.conflicts.map((conflict) => conflict.path),
    ["second.txt"],
  );
  assert.equal(
    await readFile(path.join(applicationRoot, "first.txt"), "utf8"),
    "first-before\n",
  );
  assert.equal(
    await readFile(path.join(applicationRoot, "second.txt"), "utf8"),
    "developer-edit\n",
  );
});

test("reports rollback conflicts before restoring any target", async (t) => {
  const applicationRoot = await ciCreateTestApplication(t);
  await writeFile(path.join(applicationRoot, "first.txt"), "first-before\n");
  await writeFile(path.join(applicationRoot, "second.txt"), "second-before\n");

  await ciRunResourceFileTransaction({
    applicationRoot,
    transactionId: "rollback-drift",
    changes: [
      { path: "first.txt", content: "first-after\n" },
      { path: "second.txt", content: "second-after\n" },
    ],
  });
  await writeFile(path.join(applicationRoot, "second.txt"), "developer-edit\n");

  const result = await ciRollbackResourceFileTransaction({
    applicationRoot,
    transactionId: "rollback-drift",
  });
  assert.equal(result.status, "conflicted");
  assert.deepEqual(
    result.conflicts.map((conflict) => conflict.path),
    ["second.txt"],
  );
  assert.equal(
    await readFile(path.join(applicationRoot, "first.txt"), "utf8"),
    "first-after\n",
  );
  assert.equal(
    await readFile(path.join(applicationRoot, "second.txt"), "utf8"),
    "developer-edit\n",
  );

  const journal = await ciReadResourceFileTransaction({
    applicationRoot,
    transactionId: "rollback-drift",
  });
  assert.equal(journal.status, "applied");
});

test("leaves transaction-created directories when unrelated files make them non-empty", async (t) => {
  const applicationRoot = await ciCreateTestApplication(t);
  const generatedPath = "generated/book/schema.generated.ts";

  await ciRunResourceFileTransaction({
    applicationRoot,
    transactionId: "keep-non-empty-directory",
    changes: [{ path: generatedPath, content: "export const schema = {};\n" }],
  });
  const unrelatedPath = path.join(applicationRoot, "generated/book/notes.txt");
  await writeFile(unrelatedPath, "keep me\n");

  const result = await ciRollbackResourceFileTransaction({
    applicationRoot,
    transactionId: "keep-non-empty-directory",
  });
  assert.equal(result.status, "rolled-back");
  assert.equal(
    await ciPathExists(path.join(applicationRoot, generatedPath)),
    false,
  );
  assert.equal(await readFile(unrelatedPath, "utf8"), "keep me\n");
  assert.equal((await lstat(path.dirname(unrelatedPath))).isDirectory(), true);
});

test("restores already-written targets when apply fails partway through", async (t) => {
  const applicationRoot = await ciCreateTestApplication(t);
  await writeFile(path.join(applicationRoot, "first.txt"), "first-before\n");
  await writeFile(path.join(applicationRoot, "second.txt"), "second-before\n");

  const prepared = await ciCreateResourceFileTransaction({
    applicationRoot,
    transactionId: "partial-apply",
    changes: [
      { path: "first.txt", content: "first-after\n" },
      { path: "second.txt", content: "second-after\n" },
    ],
  });
  const secondEntry = prepared.files.find(
    (entry) => entry.path === "second.txt",
  );
  await unlink(
    path.join(
      path.dirname(prepared.journalPath),
      "blobs",
      secondEntry.after.sha256,
    ),
  );

  await assert.rejects(
    ciApplyResourceFileTransaction({
      applicationRoot,
      transactionId: "partial-apply",
    }),
    { code: "CI_RESOURCE_FILE_APPLY_FAILED" },
  );
  assert.equal(
    await readFile(path.join(applicationRoot, "first.txt"), "utf8"),
    "first-before\n",
  );
  assert.equal(
    await readFile(path.join(applicationRoot, "second.txt"), "utf8"),
    "second-before\n",
  );

  const journal = await ciReadResourceFileTransaction({
    applicationRoot,
    transactionId: "partial-apply",
  });
  assert.equal(journal.status, "failed-rolled-back");
});
