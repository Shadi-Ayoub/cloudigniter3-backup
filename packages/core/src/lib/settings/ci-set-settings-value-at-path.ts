import type { CiSettings, CiSettingsValue } from "@ci-core/types";

export function ciSetSettingsValueAtPath(
  source: CiSettings | null | undefined,
  path: string,
  value: CiSettingsValue,
): CiSettings {
  const output: CiSettings = structuredClone(source ?? {});
  const segments = path.split(".").filter(Boolean);

  if (segments.length === 0) return output;

  let current: Record<string, unknown> = output;

  for (const segment of segments.slice(0, -1)) {
    const next = current[segment];

    if (!next || typeof next !== "object" || Array.isArray(next)) {
      current[segment] = {};
    }

    current = current[segment] as Record<string, unknown>;
  }

  const last = segments.at(-1);

  if (last) {
    current[last] = value;
  }

  return output;
}
