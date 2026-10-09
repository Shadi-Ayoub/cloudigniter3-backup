declare module "@docs-developer-dictionaries" {
  const dictionaries: import("../components/DictionaryViewer/dictionaries").Dictionary[];
  export default dictionaries;
}

declare module "@docs-page-dates" {
  const registry: { pages: Record<string, { updatedAt: string }> };
  export default registry;
}
