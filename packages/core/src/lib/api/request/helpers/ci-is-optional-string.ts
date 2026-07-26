export function ciIsOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === "string";
}
