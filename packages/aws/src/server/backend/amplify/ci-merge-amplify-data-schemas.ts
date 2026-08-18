export type CiAmplifyDataSchemaRecord = Readonly<Record<string, unknown>>;

type CiSchemaFragmentIntersection<T> = (
  T extends unknown ? (value: T) => void : never
) extends (value: infer TIntersection) => void
  ? TIntersection
  : never;

/**
 * Merges independently owned Amplify Data schema fragments without allowing a
 * later fragment to replace an existing model, custom operation, enum, or
 * custom type silently.
 */
export function ciMergeAmplifyDataSchemas<
  const TFragments extends readonly CiAmplifyDataSchemaRecord[],
>(
  ...fragments: TFragments
): CiSchemaFragmentIntersection<TFragments[number]> {
  const merged: Record<string, unknown> = {};

  for (const fragment of fragments) {
    for (const [name, definition] of Object.entries(fragment)) {
      if (Object.hasOwn(merged, name)) {
        throw new Error(
          `Amplify Data schema name collision: "${name}" is registered more than once. ` +
            "Rename the application-owned schema entry instead of replacing a CloudIgniter core entry.",
        );
      }

      merged[name] = definition;
    }
  }

  return merged as CiSchemaFragmentIntersection<TFragments[number]>;
}
