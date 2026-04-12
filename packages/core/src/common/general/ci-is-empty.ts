/**
 * Returns `true` when a value is considered "empty":
 * - `null` or `undefined`
 * - An empty array: `[]`
 * - A plain object with no own enumerable keys: `{}`
 * - Falsy primitives: `''`, `0`, `false`, `NaN`
 *
 * For non-empty arrays/objects and truthy primitives, it returns `false`.
 */
export function ciIsEmpty<T>(obj: T | null | undefined): boolean {
  if (!obj) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  return typeof obj === 'object' ? Object.keys(obj as object).length === 0 : false;
}
