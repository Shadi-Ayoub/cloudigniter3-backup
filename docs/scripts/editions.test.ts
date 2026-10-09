import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import docsEditionPlugin from "../plugins/docs-edition";
import { docsEdition } from "./docs-edition";
import remarkProtectedLinks from "../plugins/remark-protected-links";

test("unknown editions fail rather than selecting an unrestricted fallback", () => {
  assert.throws(() => docsEdition("users"), /DOCS_EDITION/);
  assert.equal(docsEdition("public"), "public");
  assert.equal(docsEdition("developer"), "developer");
});

test("public bundling removes private dates/catalog imports and rejects company modules even without routes", async () => {
  const siteDir = await mkdtemp(path.join(tmpdir(), "docs-editions-"));
  const previous = process.env.DOCS_EDITION;
  process.env.DOCS_EDITION = "public";
  try {
    await writeFile(
      path.join(siteDir, "page-dates.json"),
      JSON.stringify({
        pages: {
          "docs/docs/intro.mdx": { updatedAt: "public" },
          "docs/commands/ci/index.mdx": { updatedAt: "public" },
          "docs/company-developers/internal.mdx": { updatedAt: "internal" },
          "docs/commands/dev/internal.mdx": { updatedAt: "internal" },
          ".agents/skills/internal/SKILL.md": { updatedAt: "internal" },
        },
      }),
    );
    const plugin = docsEditionPlugin({ siteDir });
    const registry = JSON.parse(
      await readFile(
        path.join(siteDir, ".generated/editions/public-page-dates.json"),
        "utf8",
      ),
    );
    assert.deepEqual(Object.keys(registry.pages), [
      "docs/docs/intro.mdx",
      "docs/commands/ci/index.mdx",
    ]);
    // Exercise the compiler hook itself, including a module with no generated route.
    const webpack = plugin.configureWebpack?.(
      {} as never,
      false,
      {} as never,
      undefined,
    );
    assert.ok(webpack);
    assert.equal(
      webpack.resolve?.alias?.["@docs-developer-dictionaries"],
      path.join(
        siteDir,
        "src/components/DictionaryViewer/public-dictionaries.ts",
      ),
    );
    let check: ((modules: Iterable<object>) => void) | undefined;
    const compiler = {
      hooks: {
        compilation: {
          tap: (_name: string, handler: (value: object) => void) =>
            handler({
              hooks: {
                finishModules: {
                  tap: (_name: string, handler: typeof check) => {
                    check = handler;
                  },
                },
              },
            }),
        },
      },
    };
    for (const item of webpack.plugins ?? []) {
      if (typeof item === "object" && item && "apply" in item)
        item.apply(compiler as never);
    }
    assert.ok(check);
    assert.doesNotThrow(() =>
      check?.([{ resource: path.join(siteDir, "docs/intro.mdx") }]),
    );
    for (const source of [
      "company-developers/internal.mdx",
      "developer-dictionary/a.mdx",
      "developer-dictionary-terms.ts",
      "commands/dev/internal.mdx",
      ".generated/skills/private.md",
      "page-dates.json",
    ]) {
      assert.throws(
        () => check?.([{ resource: path.join(siteDir, source) }]),
        /Company source/,
      );
    }
  } finally {
    if (previous === undefined) delete process.env.DOCS_EDITION;
    else process.env.DOCS_EDITION = previous;
    await rm(siteDir, { recursive: true, force: true });
  }
});

test("public references point to gated developer URLs while local preview links stay unchanged", () => {
  const previous = process.env.DOCS_EDITION;
  try {
    for (const edition of ["public", "preview", "developer"]) {
      process.env.DOCS_EDITION = edition;
      const tree = {
        type: "root",
        children: [
          { type: "link", url: "/company-developers/topic#details" },
          { type: "link", url: "/commands/dev/github-scaffold" },
          { type: "link", url: "/docs/intro" },
        ],
      };
      remarkProtectedLinks()(tree);
      assert.equal(
        tree.children[0].url,
        edition === "public"
          ? "https://docs.cloudigniter.io/developers/company-developers/topic#details"
          : "/company-developers/topic#details",
      );
      assert.equal(
        tree.children[1].url,
        edition === "public"
          ? "https://docs.cloudigniter.io/developers/commands/dev/github-scaffold"
          : "/commands/dev/github-scaffold",
      );
      assert.equal(tree.children[2].url, "/docs/intro");
    }
  } finally {
    if (previous === undefined) delete process.env.DOCS_EDITION;
    else process.env.DOCS_EDITION = previous;
  }
});
