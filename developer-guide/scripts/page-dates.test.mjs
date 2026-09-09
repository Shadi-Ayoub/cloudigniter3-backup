import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  checkPageDates,
  collectPageHashes,
  updatePageDates,
  validateRegistry,
} from "./page-dates.mjs";

const baseline = "2026-09-09T15:42:24.000Z";
const later = "2026-09-10T09:30:00.000Z";
const hashA = "a".repeat(64);
const hashB = "b".repeat(64);
const hashes = {
  "developer-guide/docs/intro.mdx": hashA,
  ".agents/skills/example/SKILL.md": hashB,
};
const initial = () =>
  updatePageDates(hashes, { version: 1, pages: {} }, baseline);

test("initializes every page with the same created and updated baseline", () => {
  const registry = initial();
  for (const dates of Object.values(registry.pages)) {
    assert.equal(dates.createdAt, baseline);
    assert.equal(dates.updatedAt, baseline);
  }
  assert.deepEqual(checkPageDates(hashes, registry), []);
});

test("a repeated update preserves all timestamps when page content is unchanged", () => {
  const registry = initial();
  assert.deepEqual(updatePageDates(hashes, registry, later), registry);
});

test("advances only the edited page's updated timestamp and preserves creation", () => {
  const changed = { ...hashes, "developer-guide/docs/intro.mdx": hashB };
  const registry = initial();
  const next = updatePageDates(changed, registry, later);
  assert.deepEqual(next.pages["developer-guide/docs/intro.mdx"], {
    createdAt: baseline,
    updatedAt: later,
    contentHash: hashB,
  });
  assert.deepEqual(
    next.pages[".agents/skills/example/SKILL.md"],
    registry.pages[".agents/skills/example/SKILL.md"],
  );
  assert.deepEqual(checkPageDates(changed, next), []);
});

test("initializes new pages and removes entries for deleted pages", () => {
  const changed = { "developer-guide/dictionary/a.mdx": hashA };
  const next = updatePageDates(changed, initial(), later);
  assert.deepEqual(next.pages, {
    "developer-guide/dictionary/a.mdx": {
      createdAt: later,
      updatedAt: later,
      contentHash: hashA,
    },
  });
});

test("check reports missing, changed, and removed pages without modifying the registry", () => {
  const registry = initial();
  const before = JSON.stringify(registry);
  assert.deepEqual(
    checkPageDates(
      {
        "developer-guide/docs/intro.mdx": hashB,
        "developer-guide/docs/new.mdx": hashA,
      },
      registry,
    ),
    [
      ".agents/skills/example/SKILL.md",
      "developer-guide/docs/intro.mdx",
      "developer-guide/docs/new.mdx",
    ],
  );
  assert.equal(JSON.stringify(registry), before);
});

test("rejects invalid dates, inconsistent date order, and clock rollback", () => {
  for (const createdAt of ["yesterday", "2026-02-30T15:42:24.000Z", later]) {
    assert.throws(
      () =>
        validateRegistry({
          version: 1,
          pages: {
            page: { createdAt, updatedAt: baseline, contentHash: hashA },
          },
        }),
      /Invalid page dates/,
    );
  }
  assert.throws(
    () =>
      updatePageDates(
        { ...hashes, "developer-guide/docs/intro.mdx": hashB },
        initial(),
        "2026-09-08T00:00:00.000Z",
      ),
    /backwards/,
  );
});

test("discovers authored pages and canonical skill sources while ignoring generated files", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ci-page-dates-"));
  try {
    for (const source of [
      "developer-guide/docs/intro.mdx",
      "developer-guide/docs/api-reference/example.md",
      "developer-guide/company-developers/workflow.mdx",
      "developer-guide/dictionary/a.mdx",
      ".agents/skills/example/SKILL.md",
      ".codex/skills/example/references/workflow.md",
      "developer-guide/.generated/skills/agents/skills/example/SKILL.md",
      "developer-guide/docs/_partial.mdx",
      "developer-guide/docs/._intro.mdx",
      "developer-guide/docs/_category_.json",
    ]) {
      const filename = path.join(root, source);
      fs.mkdirSync(path.dirname(filename), { recursive: true });
      fs.writeFileSync(filename, "Example content\n");
    }
    const found = collectPageHashes(root);
    assert.equal(Object.keys(found).length, 7);
    assert.ok(found["developer-guide/docs/_category_.json"]);
    assert.ok(found[".agents/skills/example/SKILL.md"]);
    assert.ok(found[".codex/skills/example/references/workflow.md"]);
    const previous = found["developer-guide/docs/intro.mdx"];
    fs.appendFileSync(
      path.join(root, "developer-guide/docs/intro.mdx"),
      "An edit.\n",
    );
    assert.notEqual(
      collectPageHashes(root)["developer-guide/docs/intro.mdx"],
      previous,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
