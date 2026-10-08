import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { dictionaryTermsByLetter } from "../dictionary-terms";
import { developerDictionaryTermsByLetter } from "../developer-dictionary-terms";
import { getDictionaryTerms } from "../dictionary-catalog";
import remarkDictionaryTerms from "../plugins/remark-dictionary-terms";
import { findDictionaryTerm } from "../src/components/DictionaryViewer/links";

const siteDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const dictionaries = [
  {
    id: "user" as const,
    basePath: "/dictionary",
    terms: getDictionaryTerms(dictionaryTermsByLetter, "/dictionary"),
  },
  {
    id: "developer" as const,
    basePath: "/developer-dictionary",
    terms: getDictionaryTerms(
      developerDictionaryTermsByLetter,
      "/developer-dictionary"
    ),
  },
];

type Node = { type: string; value?: string; url?: string; children?: Node[] };
function paragraph(value: string): Node {
  return {
    type: "root",
    children: [{ type: "paragraph", children: [{ type: "text", value }] }],
  };
}
function links(node: Node): string[] {
  return [
    ...(node.url ? [node.url] : []),
    ...(node.children ?? []).flatMap(links),
  ];
}

test("package folder layout never opens the UI Layout definition", () => {
  const tree = paragraph("Keep the immutable package layout; inspect the folder layout and publication layout.");
  remarkDictionaryTerms({ audience: "developer" })(tree);
  assert.ok(!links(tree).includes("/dictionary/l#layout"));
  assert.deepEqual(links(tree), ["/developer-dictionary/p#package-layout"]);
  const ui = paragraph("The route layout supplies providers; UI Layout sets the shared structure.");
  remarkDictionaryTerms()(ui);
  assert.deepEqual(links(ui), ["/dictionary/l#layout", "/dictionary/l#layout"]);
});

test("CI means Continuous Integration while the lowercase executable stays distinct", () => {
  const tree = paragraph("CI validates changes; CI/CD prepares delivery. Run ci from CloudIgniter CLI. ci-build and CI_ENV_MODE are identifiers.");
  remarkDictionaryTerms()(tree);
  assert.deepEqual(links(tree), [
    "/dictionary/c#continuous-integration", "/dictionary/c#continuous-delivery", "/dictionary/c#cloudigniter-cli",
  ]);
  assert.ok(tree.children?.[0].children?.some((node) => node.type === "text" && node.value?.includes("Run ci")));
});

test("ordinary claim wording and publishing assertions do not link to authentication", () => {
  const mirrorPage = readFileSync(
    path.join(siteDir, "company-developers/publishing/strategy/source-mirroring.mdx"),
    "utf8"
  );
  const verification = mirrorPage.split("\n").find((line) => line.startsWith("Verification uses"));
  assert.ok(verification);
  for (const audience of ["user", "developer", "commands"] as const) {
    for (const value of [
      verification,
      "An editable JSON claim alone does not authorize delivery.",
      "These tests do not claim browser coverage.",
      "The JWT is unrelated to an approval claim in release metadata.",
    ]) {
      const tree = paragraph(value);
      remarkDictionaryTerms({ audience })(tree, {
        path: "/guide/commands/dev/package-build.mdx",
      });
      assert.ok(!links(tree).includes("/dictionary/c#claim"), value);
    }
  }
});

test("qualified authentication claims link as complete phrases across audiences", () => {
  for (const audience of ["user", "developer", "commands"] as const) {
    const tree = paragraph(
      "token claim; token claims; identity claim; group claims; JWT\nclaim; authentication claims; approval claim"
    );
    remarkDictionaryTerms({ audience })(tree, {
      path: "/guide/commands/dev/package-build.mdx",
    });
    assert.deepEqual(links(tree), Array(6).fill("/dictionary/c#claim"));
    const linkedText = tree.children?.[0].children
      ?.filter((node) => node.type === "link")
      .map((node) => node.children?.[0].value);
    assert.deepEqual(linkedText, [
      "token claim", "token claims", "identity claim", "group claims", "JWT\nclaim", "authentication claims",
    ]);
  }
});

test("ambiguous labels remain searchable and explicit contextual links still open their definition", () => {
  const term = dictionaries[0].terms.find(({ label }) => label === "Claim");
  assert.ok(term);
  assert.ok(term.aliases.includes("Token Claim"));
  assert.equal(
    findDictionaryTerm(term.href, "https://docs.example/docs/intro", "/", dictionaries)?.term,
    term
  );
  const tree: Node = {
    type: "root",
    children: [{ type: "paragraph", children: [{
      type: "link", url: term.href, children: [{ type: "text", value: "claim" }],
    }] }],
  };
  const original = structuredClone(tree);
  remarkDictionaryTerms()(tree);
  assert.deepEqual(tree, original);
});

test("profile names link as complete terms in prose, emphasis and table cells", () => {
  const samples = [
    ["CloudIgniter User", "/developer-dictionary/c#cloudigniter-users"],
    ["CloudIgniter Users", "/developer-dictionary/c#cloudigniter-users"],
    ["CloudIgniter Developer", "/developer-dictionary/c#cloudigniter-developers"],
    ["CloudIgniter Developers", "/developer-dictionary/c#cloudigniter-developers"],
    ["cloudigniter\nuser", "/developer-dictionary/c#cloudigniter-users"],
    ["CloudIgniter\u00a0Developer", "/developer-dictionary/c#cloudigniter-developers"],
  ];
  for (const audience of ["developer", "commands"] as const) {
    for (const type of ["paragraph", "strong", "emphasis", "tableCell"]) {
      for (const [value, url] of samples) {
        const tree: Node = { type, children: [{ type: "text", value }] };
        remarkDictionaryTerms({ audience })(tree, {
          path: "/guide/commands/dev/package-build.mdx",
        });
        assert.deepEqual(tree.children, [
          { type: "link", url, children: [{ type: "text", value }] },
        ]);
      }
    }
  }
});

test("both profile definitions and their aliases belong only to the developer dictionary", () => {
  for (const label of ["CloudIgniter User", "CloudIgniter Developer"]) {
    assert.ok(!dictionaries[0].terms.some((term) =>
      [term.label, ...term.aliases].includes(label)
    ));
    const term = dictionaries[1].terms.find((term) => term.label === label);
    assert.ok(term);
    assert.ok(term.aliases.includes(`${label}s`));
    assert.equal(
      findDictionaryTerm(term.href, "https://docs.example/docs/intro", "/", dictionaries)?.dictionary.id,
      "developer"
    );
    for (const value of [label, `${label}s`]) {
      const tree = paragraph(value);
      remarkDictionaryTerms()(tree);
      assert.ok(!links(tree).some((href) => href.startsWith("/developer-dictionary/")));
    }
  }
});

test("the full toolkit name takes precedence over the developer profile", () => {
  const tree = paragraph(
    "CloudIgniter Developer Toolkit; CloudIgniter Developer; DEV Toolkit"
  );
  remarkDictionaryTerms({ audience: "developer" })(tree);
  assert.deepEqual(links(tree), [
    "/developer-dictionary/d#dev-toolkit",
    "/developer-dictionary/c#cloudigniter-developers",
    "/developer-dictionary/d#dev-toolkit",
  ]);
});

test("developer terms stay out of public linking; developer prose retains shared terms", () => {
  const text = "DEV Toolkit, API Facade, Release Request and Tenant";
  const publicTree = paragraph(text);
  remarkDictionaryTerms()(publicTree);
  assert.deepEqual(links(publicTree), ["/dictionary/t#tenant"]);
  const developerTree = paragraph(text);
  remarkDictionaryTerms({ audience: "developer" })(developerTree);
  assert.deepEqual(links(developerTree), [
    "/developer-dictionary/d#dev-toolkit",
    "/developer-dictionary/a#api-facade",
    "/developer-dictionary/r#release-request",
    "/dictionary/t#tenant",
  ]);
  assert.ok(
    !dictionaries[0].terms.some(({ label }) => label === "DEV Toolkit")
  );
});

test("only dev command manuals receive developer auto-links", () => {
  const transform = remarkDictionaryTerms({ audience: "commands" });
  for (const source of [
    "/guide/commands/ci/build.mdx",
    "/guide/commands/index.mdx",
  ]) {
    const tree = paragraph("DEV Toolkit");
    transform(tree, { path: source });
    assert.deepEqual(links(tree), []);
  }
  for (const source of [
    "/guide/commands/dev/package-build.mdx",
    "C:\\guide\\commands\\dev\\build.mdx",
  ]) {
    const tree = paragraph("DEV Toolkit");
    transform(tree, { path: source });
    assert.deepEqual(links(tree), ["/developer-dictionary/d#dev-toolkit"]);
  }
});

test("linking preserves code, headings, authored links and word boundaries", () => {
  const transform = remarkDictionaryTerms({ audience: "developer" });
  for (const type of [
    "heading",
    "code",
    "inlineCode",
    "link",
    "mdxJsxFlowElement",
  ]) {
    const tree: Node = {
      type,
      children: [{ type: "text", value: "DEV Toolkit" }],
    };
    const original = structuredClone(tree);
    transform(tree);
    assert.deepEqual(tree, original);
  }
  const tree = paragraph("API Facades and api facade; DEV TOOLKIT");
  transform(tree);
  assert.deepEqual(links(tree), [
    "/developer-dictionary/a#api-facade",
    "/developer-dictionary/d#dev-toolkit",
  ]);
});

test("viewer links respect audience, hosted base paths, origins and invalid hashes", () => {
  const current = "https://docs.example/host/docs/intro";
  assert.equal(
    findDictionaryTerm(
      "/host/developer-dictionary/d#dev-toolkit",
      current,
      "/host/",
      dictionaries
    )?.dictionary.id,
    "developer"
  );
  assert.equal(
    findDictionaryTerm(
      "/host/dictionary/t/#tenant",
      current,
      "/host/",
      dictionaries
    )?.dictionary.id,
    "user"
  );
  for (const href of [
    "https://elsewhere.example/host/developer-dictionary/d#dev-toolkit",
    "/developer-dictionary/d#dev-toolkit",
    "/host/developer-dictionary/d#tenant",
    "/host/developer-dictionary/d#%E0%A4%A",
    "/host/developer-dictionary/d",
  ])
    assert.equal(
      findDictionaryTerm(href, current, "/host/", dictionaries),
      null
    );
});

test("each developer catalog entry has one MDX definition and a registered viewer page", () => {
  const catalog = dictionaries[1].terms;
  const viewer = readFileSync(
    path.join(siteDir, "src/components/DictionaryViewer/dictionaries.ts"),
    "utf8"
  );
  const labels = new Set<string>();
  for (const [letter, entries] of Object.entries(
    developerDictionaryTermsByLetter
  )) {
    const source = readFileSync(
      path.join(siteDir, `developer-dictionary/${letter.toLowerCase()}.mdx`),
      "utf8"
    );
    assert.match(source, /audience: developer/);
    assert.ok(
      viewer.includes(`developer-dictionary/${letter.toLowerCase()}.mdx`)
    );
    const headings = [...source.matchAll(/^## (.+) \{#([^}]+)\}$/gm)];
    assert.equal(headings.length, entries.length);
    for (const [label, anchor] of entries) {
      assert.ok(!labels.has(label));
      labels.add(label);
      assert.equal(
        headings.filter(
          (heading) => heading[1] === label && heading[2] === anchor
        ).length,
        1
      );
      assert.ok(
        catalog.some(
          (term) =>
            term.href ===
            `/developer-dictionary/${letter.toLowerCase()}#${anchor}`
        )
      );
    }
  }
});
