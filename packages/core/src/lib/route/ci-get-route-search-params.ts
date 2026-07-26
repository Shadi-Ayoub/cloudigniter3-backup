import type { CiRouteSearchParams } from "@cloudigniter/core/types";

export function ciGetRouteSearchParams(
  searchParams: URLSearchParams,
): CiRouteSearchParams {
  const result: Record<string, string | string[]> = {};

  searchParams.forEach((value, key) => {
    const existing = result[key];

    if (existing === undefined) {
      result[key] = value;
      return;
    }

    if (Array.isArray(existing)) {
      existing.push(value);
      return;
    }

    result[key] = [existing, value];
  });

  return result;
}
