/**
 * Convert PascalCase (or camelCase) → kebab-case
 */
export function ciPascalToKebab(input: string): string {
  return (
    input
      // 1. Handle transitions like "XMLHttp" → "XML-Http"
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
      // 2. Handle transitions like "fooBar" → "foo-Bar"
      .replace(/([a-z\d])([A-Z])/g, '$1-$2')
      // 3. Lowercase the whole thing
      .toLowerCase()
  );
}
