export const searchScopes = {
  all: "All guides",
  users: "User guide",
  developers: "Developer guide",
  api: "API Reference",
  ci: "ci Commands",
  dev: "dev commands",
  commands: "Commands overview",
  skills: "Skills",
} as const;

export type SearchScope = keyof typeof searchScopes;
export type SearchDocument = {
  title: string;
  description: string;
  headings: string;
  text: string;
  url: string;
  scope: Exclude<SearchScope, "all">;
  audience: "public" | "developer";
};

export function normalizeSearch(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function hasTerm(field: string, term: string): boolean {
  return field.split(" ").some((word) => word.startsWith(term));
}

export function searchDocuments(
  documents: SearchDocument[],
  query: string,
  scope: SearchScope = "all",
) {
  const phrase = normalizeSearch(query);
  if (!phrase) return [];
  const terms = [...new Set(phrase.split(/\s+/))];
  return documents
    .filter((doc) => scope === "all" || doc.scope === scope)
    .map((doc) => {
      const title = normalizeSearch(doc.title);
      const headings = normalizeSearch(doc.headings);
      const description = normalizeSearch(doc.description);
      const body = normalizeSearch(doc.text);
      const fields = [title, headings, description, body];
      if (!terms.every((term) => fields.some((field) => hasTerm(field, term))))
        return { doc, score: 0 };
      const score =
        (title === phrase ? 200 : title.includes(phrase) ? 90 : 0) +
        terms.reduce(
          (total, term) =>
            total +
            (hasTerm(title, term) ? 25 : 0) +
            (hasTerm(headings, term) ? 8 : 0) +
            (hasTerm(description, term) ? 5 : 0) +
            (hasTerm(body, term) ? 1 : 0),
          0,
        );
      return { doc, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title))
    .map(({ doc }) => doc);
}

export function searchExcerpt(doc: SearchDocument, query: string): string {
  const text = doc.text || doc.description;
  const terms = query.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  const positions = terms
    .map((term) => text.toLowerCase().indexOf(term))
    .filter((index) => index >= 0);
  const start = Math.max(
    0,
    (positions.length ? Math.min(...positions) : 0) - 70,
  );
  const excerpt = text.slice(start, start + 250);
  return `${start ? "…" : ""}${excerpt}${start + 250 < text.length ? "…" : ""}`;
}

/** Strip Markdown/MDX presentation while retaining searchable code examples. */
export function searchableText(markdown: string): string {
  return markdown
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "")
    .split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g)
    .map((section, index) =>
      index % 2
        ? section.replace(/^(?:```|~~~)[^\n]*\n|(?:```|~~~)$/g, "")
        : section
            .replace(/^(?:import|export)\s[\s\S]*?;\s*$/gm, "")
            .replace(/<!--[\s\S]*?-->/g, "")
            .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
            .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
            .replace(
              /<\/?(?:[A-Z][\w.]*|div|span|p|br|details|summary|img|a|table)\b[^>]*>/g,
              "",
            ),
    )
    .join(" ")
    .replace(/\{#[^}]+\}|:::[^\n]*|[#*_`|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
