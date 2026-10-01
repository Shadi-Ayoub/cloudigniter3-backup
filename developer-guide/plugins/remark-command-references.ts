import fs from "node:fs";
import path from "node:path";

type CommandReference = { name: string; url: string; source: string };
export type CommandNode = {
  type: string;
  value?: string;
  url?: string;
  name?: string;
  lang?: string | null;
  children?: CommandNode[];
  data?: { commandReferences?: boolean };
};

// Read the authored catalog instead of maintaining another list of commands.
const commandsDirectory = path.resolve(__dirname, "../commands");
const references: CommandReference[] = ["ci", "dev"]
  .flatMap((family) =>
    fs
      .readdirSync(path.join(commandsDirectory, family))
      .filter((file) => file.endsWith(".mdx") && file !== "index.mdx")
      .map((file) => {
        const source = path.join(commandsDirectory, family, file);
        const title = fs
          .readFileSync(source, "utf8")
          .match(/^title:\s*(.+)$/m)?.[1];
        if (!title) throw new Error(`Missing command title in ${source}`);
        const name: string = title.startsWith('"')
          ? JSON.parse(title)
          : title.replace(/^'|'$/g, "");
        return {
          name,
          source,
          url: `/commands/${family}/${file.slice(0, -4)}`,
        };
      }),
  )
  .sort((a, b) => b.name.length - a.name.length);

const byName = new Map(
  references.map((reference) => [reference.name, reference]),
);
const commandPattern = new RegExp(
  `(?<![\\p{L}\\p{N}_./@\\\\-])(?:${references
    .map(({ name }) =>
      name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+"),
    )
    .join("|")})(?![\\p{L}\\p{N}_/-]|\\.[\\p{L}\\p{N}_])`,
  "gu",
);
const skipped = new Set([
  "link",
  "linkReference",
  "definition",
  "html",
  "mdxjsEsm",
  "mdxFlowExpression",
  "mdxTextExpression",
  "yaml",
  "toml",
]);
const shellLanguages = new Set([
  "bash",
  "sh",
  "shell",
  "zsh",
  "console",
  "shell-session",
  "terminal",
]);

function commandMatches(value: string, source: string) {
  return [...value.matchAll(commandPattern)].flatMap((match) => {
    const reference = byName.get(match[0].replace(/\s+/g, " "));
    return reference && reference.source !== source
      ? [{ reference, index: match.index, text: match[0] }]
      : [];
  });
}

function linkMentions(node: CommandNode, source: string): CommandNode[] {
  const value = node.value ?? "";
  const matches = commandMatches(value, source);
  if (!matches.length) return [node];
  // Preserve an invocation's inline-code styling, including launcher and flags.
  if (node.type === "inlineCode" && matches.length === 1)
    return [{ type: "link", url: matches[0].reference.url, children: [node] }];
  const result: CommandNode[] = [];
  let cursor = 0;
  for (const match of matches) {
    if (match.index > cursor)
      result.push({ type: node.type, value: value.slice(cursor, match.index) });
    result.push({
      type: "link",
      url: match.reference.url,
      children: [{ type: node.type, value: match.text }],
    });
    cursor = match.index + match.text.length;
  }
  if (cursor < value.length)
    result.push({ type: node.type, value: value.slice(cursor) });
  return result;
}

function shellReferences(
  node: CommandNode,
  source: string,
): CommandNode | undefined {
  if (!shellLanguages.has(node.lang?.toLowerCase() ?? "")) return;
  const value = (node.value ?? "").replace(/\\\r?\n\s*/g, " ");
  const commands = [
    ...new Map(
      commandMatches(value, source).map(({ reference }) => [
        reference.name,
        reference,
      ]),
    ).values(),
  ];
  if (!commands.length) return;
  return {
    type: "paragraph",
    data: { commandReferences: true },
    children: [
      {
        type: "text",
        value:
          commands.length === 1
            ? "Command reference: "
            : "Command references: ",
      },
      ...commands.flatMap((reference, index): CommandNode[] => [
        ...(index ? [{ type: "text", value: " · " }] : []),
        {
          type: "link",
          url: reference.url,
          children: [{ type: "inlineCode", value: reference.name }],
        },
      ]),
    ],
  };
}

function transform(node: CommandNode, source: string): void {
  if (skipped.has(node.type) || node.data?.commandReferences || !node.children)
    return;
  // Markdown inside MDX callouts is safe; explicit HTML/JSX anchors stay intact.
  if (node.type.startsWith("mdxJsx") && ["a", "Link"].includes(node.name ?? ""))
    return;
  for (let index = 0; index < node.children.length; index++) {
    const child = node.children[index];
    if (child.type === "code") {
      const links = shellReferences(child, source);
      if (links && !node.children[index + 1]?.data?.commandReferences) {
        node.children.splice(index + 1, 0, links);
        index++;
      }
    } else if (child.type === "text" || child.type === "inlineCode") {
      const replacements = linkMentions(child, source);
      node.children.splice(index, 1, ...replacements);
      index += replacements.length - 1;
    } else transform(child, source);
  }
}

export default function remarkCommandReferences() {
  return (tree: CommandNode, file: { path?: string } = {}) =>
    transform(tree, file.path ? path.resolve(file.path) : "");
}
