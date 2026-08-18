/** HTML-compatible pattern for kebab-cased access-control identifiers. */
export const CI_ACCESS_CONTROL_KEBAB_IDENTIFIER_PATTERN =
  "^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$";

const accessControlKebabIdentifierPattern = new RegExp(
  CI_ACCESS_CONTROL_KEBAB_IDENTIFIER_PATTERN
);

/** Checks whether an identifier uses lowercase kebab case and starts with a letter. */
export function ciIsAccessControlKebabIdentifier(value: string): boolean {
  return accessControlKebabIdentifierPattern.test(value);
}
