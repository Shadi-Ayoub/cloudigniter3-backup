/**
 * Returns `true` when a value is considered "empty":
 * - `null` or `undefined`
 * - An empty array: `[]`
 * - A plain object with no own enumerable keys: `{}`
 * - Falsy primitives: `''`, `0`, `false`, `NaN`
 *
 * For non-empty arrays/objects and truthy primitives, it returns `false`.
 */
export declare function ciIsEmpty<T>(obj: T | null | undefined): boolean;
//# sourceMappingURL=ci-is-empty.d.ts.map