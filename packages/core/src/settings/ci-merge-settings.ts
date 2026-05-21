import type { CiSettings } from "@/types";

export function ciMergeSettings<TSettings extends CiSettings>(
  ...layers: Array<Partial<TSettings> | null | undefined>
): TSettings {
  return layers.reduce<CiSettings>((merged, layer) => {
    if (!layer) return merged;
    return ciDeepMerge(merged, layer as CiSettings);
  }, {}) as TSettings;
}

function ciDeepMerge(target: CiSettings, source: CiSettings): CiSettings {
  const output: CiSettings = { ...target };

  for (const [key, value] of Object.entries(source)) {
    const existing = output[key];

    if (ciIsPlainObject(existing) && ciIsPlainObject(value)) {
      output[key] = ciDeepMerge(existing, value);
      continue;
    }

    output[key] = value;
  }

  return output;
}

function ciIsPlainObject(value: unknown): value is CiSettings {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
