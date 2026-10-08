export type DictionaryTermsByLetter = Readonly<
  Record<
    string,
    ReadonlyArray<
      readonly [
        label: string,
        anchor: string,
        aliases?: readonly string[],
        options?: { readonly autoLinkLabel?: boolean; readonly caseSensitive?: boolean },
      ]
    >
  >
>;

export type DictionaryTerm = {
  label: string;
  anchor: string;
  letter: string;
  href: string;
  aliases: readonly string[];
  autoLinkLabel: boolean;
  caseSensitive: boolean;
};

export function getDictionaryTerms(
  termsByLetter: DictionaryTermsByLetter,
  basePath: string
): DictionaryTerm[] {
  return Object.entries(termsByLetter)
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([letter, terms]) =>
      [...terms]
        .sort(([left], [right]) =>
          left.localeCompare(right, "en", {
            sensitivity: "base",
            ignorePunctuation: true,
          })
        )
        .map(([label, anchor, aliases = [], options]) => ({
          label,
          anchor,
          aliases,
          autoLinkLabel: options?.autoLinkLabel ?? true,
          caseSensitive: options?.caseSensitive ?? false,
          letter,
          href: `${basePath}/${letter.toLowerCase()}#${anchor}`,
        }))
    );
}

export function createDictionarySidebar(
  termsByLetter: DictionaryTermsByLetter,
  basePath: string
) {
  const terms = getDictionaryTerms(termsByLetter, basePath);
  return [
    "index",
    ...Object.keys(termsByLetter)
      .sort()
      .map((letter) => ({
        type: "category" as const,
        label: letter,
        link: { type: "doc" as const, id: letter.toLowerCase() },
        items: terms
          .filter((term) => term.letter === letter)
          .map(({ label, href }) => ({ type: "link" as const, label, href })),
      })),
  ];
}
