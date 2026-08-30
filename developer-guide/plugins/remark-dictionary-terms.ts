import dictionarySidebars from "../dictionary-sidebars";

type DictionarySidebarCategory = {
  items: Array<{ href: string; label: string; type: "link" }>;
  label: string;
  type: "category";
};

type DictionaryTerm = {
  href: string;
  label: string;
};

type MdastNode = {
  children?: MdastNode[];
  type: string;
  url?: string;
  value?: string;
};

const skippedContainers = new Set([
  "code",
  "definition",
  "heading",
  "html",
  "inlineCode",
  "link",
  "linkReference",
  "mdxjsEsm",
  "toml",
  "yaml",
]);

const dictionaryTerms = (
  dictionarySidebars.dictionarySidebar as unknown as Array<
    DictionarySidebarCategory | string
  >
)
  .filter(
    (item): item is DictionarySidebarCategory =>
      typeof item !== "string" && item.type === "category"
  )
  .flatMap((category) =>
    category.items.map((item) => ({
      href: item.href,
      label: item.label,
    }))
  )
  .sort((left, right) => right.label.length - left.label.length);

const termsByLabel = new Map(
  dictionaryTerms.map((term) => [term.label.toLocaleLowerCase(), term])
);

const dictionaryTermPattern = new RegExp(
  `(?<![\\p{L}\\p{N}_])(?:${dictionaryTerms
    .map((term) => escapeRegularExpression(term.label))
    .join("|")})(?![\\p{L}\\p{N}_])`,
  "giu"
);

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function linkDictionaryTerms(node: MdastNode): MdastNode[] {
  const value = node.value ?? "";
  const replacements: MdastNode[] = [];
  let cursor = 0;

  dictionaryTermPattern.lastIndex = 0;

  for (const match of value.matchAll(dictionaryTermPattern)) {
    const matchStart = match.index;
    const matchedText = match[0];
    const term = termsByLabel.get(matchedText.toLocaleLowerCase());

    if (!term) {
      continue;
    }

    if (matchStart > cursor) {
      replacements.push({
        type: "text",
        value: value.slice(cursor, matchStart),
      });
    }

    replacements.push({
      children: [{ type: "text", value: matchedText }],
      type: "link",
      url: term.href,
    });

    cursor = matchStart + matchedText.length;
  }

  if (replacements.length === 0) {
    return [node];
  }

  if (cursor < value.length) {
    replacements.push({ type: "text", value: value.slice(cursor) });
  }

  return replacements;
}

function transformNode(node: MdastNode): void {
  if (
    skippedContainers.has(node.type) ||
    node.type.startsWith("mdxJsx") ||
    !node.children
  ) {
    return;
  }

  for (let index = 0; index < node.children.length; index += 1) {
    const child = node.children[index];

    if (child.type === "text") {
      const replacements = linkDictionaryTerms(child);
      node.children.splice(index, 1, ...replacements);
      index += replacements.length - 1;
      continue;
    }

    transformNode(child);
  }
}

export default function remarkDictionaryTerms() {
  return (tree: MdastNode) => transformNode(tree);
}
