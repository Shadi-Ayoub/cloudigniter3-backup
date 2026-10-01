import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { RouteConfig } from "@docusaurus/types";
import guideSearch from "../plugins/guide-search";
import {
  searchDocuments,
  searchableText,
  searchExcerpt,
  type SearchDocument,
} from "../src/utils/guide-search";

const docs: SearchDocument[] = [
  {
    title: "Module workflows",
    description: "Work with modules",
    headings: "Validate modules",
    text: "Run ci modules validate --root=src/custom/modules to check exports.",
    url: "/docs/modules",
    scope: "users",
    audience: "public",
  },
  {
    title: "ci modules validate",
    description: "Validate application modules",
    headings: "Syntax Parameters",
    text: "Checks manifests and dependency cycles.",
    url: "/commands/ci/modules-validate",
    scope: "ci",
    audience: "public",
  },
  {
    title: "dev modules validate",
    description: "Validate core modules",
    headings: "Parameters",
    text: "Use --kind=core in the private workspace.",
    url: "/commands/dev/modules-validate",
    scope: "dev",
    audience: "developer",
  },
];

test("exact command titles outrank incidental body matches", () => {
  assert.equal(
    searchDocuments(docs, "CI modules validate")[0].url,
    "/commands/ci/modules-validate"
  );
});
test("finds code flags, hyphenated options, and all query terms", () => {
  assert.deepEqual(
    searchDocuments(docs, "--root=src/custom/modules").map((d) => d.url),
    ["/docs/modules"]
  );
  assert.equal(searchDocuments(docs, "dependency cycles").length, 1);
  assert.equal(searchDocuments(docs, "dependency absentword").length, 0);
});
test("filters guide scope and handles empty and no-match input", () => {
  assert.equal(searchDocuments(docs, "modules", "dev").length, 1);
  assert.equal(searchDocuments(docs, "modules", "api").length, 0);
  assert.equal(searchDocuments(docs, "  ").length, 0);
  assert.equal(searchDocuments(docs, "---").length, 0);
  assert.equal(searchDocuments(docs, "missing-command").length, 0);
});
test("matches token prefixes and camel-case APIs without incidental substrings", () => {
  assert.equal(searchDocuments(docs, "ci").length, 2);
  assert.equal(searchDocuments(docs, "modul").length, 3);
  assert.equal(
    searchDocuments(
      [{ ...docs[0], title: "ciCreateAuthorizer" }],
      "create authorizer"
    ).length,
    1
  );
  assert.ok(
    searchableText("```text\nci --root=<path>\n```").includes("<path>")
  );
});
test("indexes prose and code without MDX imports, frontmatter, or link destinations", () => {
  const body = searchableText(
    '---\ntitle: Hidden metadata\n---\nimport Thing from "@site/Thing";\n\n## Exports\nUse [modules](/docs/internal-url).\n```bash\nci modules validate --no-interactive\n```'
  );
  assert.ok(body.includes("ci modules validate --no-interactive"));
  assert.ok(body.includes("Use modules"));
  assert.ok(!/Hidden|import|internal-url/.test(body));
});
test("excerpts include a body match beyond the document introduction", () => {
  const doc = {
    ...docs[0],
    text:
      "Introduction. ".repeat(60) +
      "resource studio token" +
      " trailing text".repeat(50),
  };
  const excerpt = searchExcerpt(doc, "resource");
  assert.ok(excerpt.includes("resource studio"));
  assert.ok(excerpt.startsWith("…"));
  assert.ok(excerpt.length <= 252);
});

test("preserves import and export examples while excluding MDX presentation imports", () => {
  const body = searchableText(
    'import Demo from "@site/Demo";\n\n```ts\nimport { ciCreateAuthorizer } from "@cloudigniter/core/lib";\nexport const authorizer = ciCreateAuthorizer();\n```'
  );
  assert.ok(!body.includes("@site/Demo"));
  assert.ok(body.includes("@cloudigniter/core/lib"));
  assert.ok(body.includes("export const authorizer"));
});

test("generated search index excludes Dictionary and preserves other guides and custom permalinks", async () => {
  const siteDir = await mkdtemp(path.join(tmpdir(), "guide-search-"));
  try {
    await writeFile(
      path.join(siteDir, "guide.mdx"),
      "# Guide topic\nUse ci modules validate for module checks."
    );
    await writeFile(
      path.join(siteDir, "dictionary.mdx"),
      "# Dictionary-only term\nDictionary-only definition."
    );
    const doc = {
      id: "intro",
      title: "Guide topic",
      description: "Guide description",
      source: "@site/guide.mdx",
      permalink: "/host/docs/custom-slug",
    };
    const plugin = guideSearch({ siteDir, baseUrl: "/host/" });
    let index: SearchDocument[] = [];
    let route: RouteConfig | undefined;
    await plugin.allContentLoaded?.({
      allContent: {
        "docusaurus-plugin-content-docs": {
          default: {
            loadedVersions: [
              {
                docs: [
                  doc,
                  { ...doc, draft: true },
                  { ...doc, unlisted: true },
                ],
              },
            ],
          },
          companyDevelopers: {
            loadedVersions: [
              {
                docs: [
                  {
                    ...doc,
                    title: "Contributor topic",
                    permalink: "/host/company-developers/topic",
                  },
                ],
              },
            ],
          },
          commands: {
            loadedVersions: [
              {
                docs: [
                  {
                    ...doc,
                    id: "ci/modules-validate",
                    title: "ci modules validate",
                    permalink: "/host/commands/ci/modules-validate",
                  },
                ],
              },
            ],
          },
          developerDictionary: {
            loadedVersions: [
              {
                docs: [
                  {
                    ...doc,
                    title: "Developer dictionary-only term",
                    source: "@site/does-not-exist-in-search.mdx",
                    permalink: "/host/developer-dictionary/d",
                  },
                ],
              },
            ],
          },
          dictionary: {
            loadedVersions: [
              {
                docs: [
                  {
                    ...doc,
                    title: "Dictionary-only term",
                    source: "@site/dictionary.mdx",
                    permalink: "/host/dictionary/g",
                  },
                ],
              },
            ],
          },
        },
      },
      actions: {
        createData: async (name, data) => {
          assert.equal(name, "search-index.json");
          index = JSON.parse(String(data));
          return "/generated/search-index.json";
        },
        addRoute: (value) => {
          route = value;
        },
        setGlobalData: () => {},
      },
    });
    assert.deepEqual(
      index.map(({ url }) => url),
      [
        "/host/docs/custom-slug",
        "/host/company-developers/topic",
        "/host/commands/ci/modules-validate",
      ]
    );
    assert.equal(searchDocuments(index, "dictionary").length, 0);
    assert.ok(!JSON.stringify(index).includes("Dictionary-only"));
    assert.equal(searchDocuments(index, "ci modules validate")[0].scope, "ci");
    assert.equal(route?.path, "/host/search");
    assert.deepEqual(route?.modules, {
      searchIndex: "/generated/search-index.json",
    });
  } finally {
    await rm(siteDir, { recursive: true, force: true });
  }
});
