/**
 * Object.getOwnPropertyNames catch non-enumerable properties or exclude things like
 * Dates/custom‐class instances.
 *
 * @param obj
 * @returns
 */
export function ciIsEmptyObject(obj: unknown): obj is Record<string, never> {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj) && Object.getOwnPropertyNames(obj).length === 0;
}
