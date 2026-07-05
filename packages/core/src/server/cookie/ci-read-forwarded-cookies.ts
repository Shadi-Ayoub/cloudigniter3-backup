/**
 * Reads CloudIgniter and application-scoped request cookies for diagnostics.
 */
export function ciReadForwardedCookies(requestCookies: {
  getAll(): Array<{
    name: string;
    value: string;
  }>;
}): Record<string, string> {
  const values: Record<string, string> = {};

  for (const { name, value } of requestCookies.getAll()) {
    const normalizedName = name.toLowerCase();

    if (normalizedName.startsWith("ci-") || normalizedName.startsWith("app-")) {
      values[name] = value;
    }
  }

  return Object.fromEntries(
    Object.entries(values).sort(([left], [right]) => left.localeCompare(right)),
  );
}
