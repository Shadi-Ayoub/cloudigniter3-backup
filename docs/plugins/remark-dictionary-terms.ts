import { dictionaryTermsByLetter } from "../dictionary-terms";
import { developerDictionaryTermsByLetter } from "../developer-dictionary-terms";
import { getDictionaryTerms } from "../dictionary-catalog";

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

function createTransform(includeDeveloperTerms: boolean) {
  const dictionaryTerms = [
    ...getDictionaryTerms(dictionaryTermsByLetter, "/dictionary"),
    ...(includeDeveloperTerms
      ? getDictionaryTerms(
          developerDictionaryTermsByLetter,
          "/developer-dictionary"
        )
      : []),
  ];

  // Match complete names and aliases before shorter terms such as CloudIgniter.
  const termNames = dictionaryTerms
    .flatMap((term) =>
      // Ambiguous labels require an authored link; qualified aliases can still link.
      [...(term.autoLinkLabel ? [term.label] : []), ...term.aliases]
        .map((name) => ({ name, term }))
    )
    .sort((left, right) => right.name.length - left.name.length);

  function normalizeName(value: string): string {
    return value.replace(/\s+/g, " ").toLocaleLowerCase();
  }

  const termsByLabel = new Map(
    termNames.map(({ name, term }) => [normalizeName(name), term])
  );

  const dictionaryTermPattern = new RegExp(
    `(?<![\\p{L}\\p{N}_])(?:${termNames
      .map(({ name }) => escapeRegularExpression(name).replace(/\s+/g, "\\s+"))
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
      const term = termsByLabel.get(normalizeName(matchedText));

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

  return transformNode;
}

export default function remarkDictionaryTerms(
  options: { audience?: "user" | "developer" | "commands" } = {}
) {
  const publicTransform = createTransform(false);
  const developerTransform = createTransform(true);
  return (tree: MdastNode, file: { path?: string } = {}) => {
    const developer =
      options.audience === "developer" ||
      (options.audience === "commands" &&
        /(?:^|\/)commands\/dev\//.test((file.path ?? "").replace(/\\/g, "/")));
    (developer ? developerTransform : publicTransform)(tree);
  };
}
