import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import remarkCommandReferences, {
  type CommandNode,
} from "../plugins/remark-command-references";
import remarkDictionaryTerms from "../plugins/remark-dictionary-terms";

function links(node: CommandNode): string[] {
  return [
    ...(node.type === "link" ? [node.url!] : []),
    ...(node.children ?? []).flatMap(links),
  ];
}
function prose(value: string): CommandNode {
  return {
    type: "root",
    children: [{ type: "paragraph", children: [{ type: "text", value }] }],
  };
}

test("workspace convenience commands link the complete website selector", () => {
  const tree = prose(
    "Use dev start docs, dev start template, dev start website jodaris, dev start website cloudigniter, and dev open terminal core.",
  );
  remarkCommandReferences()(tree);
  assert.deepEqual(links(tree), [
    "/commands/dev/start-docs",
    "/commands/dev/start-template",
    "/commands/dev/start-website-jodaris",
    "/commands/dev/start-website-cloudigniter",
    "/commands/dev/open-terminal",
  ]);
});

test("links prose commands across wrapped lines using the longest exact command", () => {
  const tree = prose(
    "Run ci modules\nvalidate, dev package build-types-raw, and dev package build.",
  );
  remarkCommandReferences()(tree);
  assert.deepEqual(links(tree), [
    "/commands/ci/modules-validate",
    "/commands/dev/package-build-types-raw",
    "/commands/dev/package-build",
  ]);
});

test("links complete inline invocations and commands in headings and tables", () => {
  const invocation =
    "pnpm --filter @cloudigniter/next exec dev package test --filter=proxy";
  const tree: CommandNode = {
    type: "root",
    children: [
      {
        type: "heading",
        children: [{ type: "inlineCode", value: invocation }],
      },
      {
        type: "table",
        children: [
          {
            type: "tableRow",
            children: [
              {
                type: "tableCell",
                children: [
                  { type: "inlineCode", value: "ci resources studio" },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
  remarkCommandReferences()(tree);
  assert.deepEqual(links(tree), [
    "/commands/dev/package-test",
    "/commands/ci/resources-studio",
  ]);
  assert.equal(tree.children![0].children![0].children![0].value, invocation);
});

test("leaves existing links, JSX anchors, expressions, and command-like identifiers alone", () => {
  const tree = prose(
    "Not mydev package test, /dev package test, dev package testing, dev package build-unknown, or ci modules validate.mjs.",
  );
  tree.children!.push(
    {
      type: "link",
      url: "/existing",
      children: [{ type: "inlineCode", value: "dev package test" }],
    },
    {
      type: "mdxJsxTextElement",
      name: "Link",
      children: [{ type: "text", value: "dev package test" }],
    },
    { type: "mdxTextExpression", value: '"ci modules validate"' },
  );
  remarkCommandReferences()(tree);
  assert.deepEqual(links(tree), ["/existing"]);
});

test("adds deduplicated reference links after shell examples without changing code", () => {
  const value =
    "pnpm exec ci \\\n  modules validate --no-interactive\npnpm exec ci modules validate\ndev package test";
  const code: CommandNode = { type: "code", lang: "bash", value };
  const tree: CommandNode = { type: "root", children: [code] };
  const transform = remarkCommandReferences();
  transform(tree);
  transform(tree);
  assert.equal(tree.children!.length, 2);
  assert.equal(tree.children![0].value, value);
  assert.deepEqual(links(tree), [
    "/commands/ci/modules-validate",
    "/commands/dev/package-test",
  ]);
});

test("does not add references inside diagrams, non-shell examples, or a command's own page", () => {
  const tree = prose("Use dev package test, then dev package quality.");
  tree.children!.push(
    { type: "code", lang: "mermaid", value: 'A["dev package build"]' },
    {
      type: "code",
      lang: "ts",
      value: 'const example = "ci modules validate";',
    },
  );
  remarkCommandReferences()(tree, {
    path: path.resolve(__dirname, "../commands/dev/package-test.mdx"),
  });
  assert.deepEqual(links(tree), ["/commands/dev/package-quality"]);
  assert.equal(tree.children!.length, 3);
});

test("links Markdown inside callouts and stays compatible with Dictionary linking", () => {
  const tree: CommandNode = {
    type: "root",
    children: [
      {
        type: "mdxJsxFlowElement",
        name: "Note",
        children: [prose("Run ci modules validate.")],
      },
      prose("Use ci resources studio to edit a Data Entity."),
    ],
  };
  remarkCommandReferences()(tree);
  remarkDictionaryTerms()(tree);
  assert.ok(links(tree).includes("/commands/ci/resources-studio"));
  assert.ok(links(tree).some((url) => url.startsWith("/dictionary/")));
  function checkNoNestedLinks(node: CommandNode, inLink = false) {
    assert.ok(!(inLink && node.type === "link"));
    for (const child of node.children ?? [])
      checkNoNestedLinks(child, inLink || node.type === "link");
  }
  checkNoNestedLinks(tree);
});
