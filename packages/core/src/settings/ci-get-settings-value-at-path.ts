import type { CiSettings } from "@/types";

export function ciGetSettingsValueAtPath<TValue = unknown>(
  source: CiSettings | null | undefined,
  path: string,
): TValue | undefined {
  if (!source || !path) return undefined;

  return path.split(".").reduce<unknown>((current, segment) => {
    if (current && typeof current === "object" && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }

    return undefined;
  }, source) as TValue | undefined;
}
