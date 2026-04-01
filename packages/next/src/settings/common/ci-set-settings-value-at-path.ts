import type { CiSettings, CiSettingsValue } from './types';

/**
 * Set a nested settings value on a shallow-cloned object.
 *
 * @param value - Source settings object.
 * @param path - Dot-separated path.
 * @param nextValue - Value to write.
 * @returns Cloned settings object with the updated nested value.
 */
export function ciSetSettingsValueAtPath(
  value: CiSettings,
  path: string,
  nextValue: CiSettingsValue,
): CiSettings {
  const root: CiSettings = { ...value };
  const parts = path.split('.').filter(Boolean);

  if (parts.length === 0) return root;

  let cursor: Record<string, CiSettingsValue> = root;

  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i]!;
    const existing = cursor[part];
    cursor[part] =
      existing && typeof existing === 'object' && !Array.isArray(existing)
        ? { ...(existing as Record<string, CiSettingsValue>) }
        : {};
    cursor = cursor[part] as Record<string, CiSettingsValue>;
  }

  cursor[parts[parts.length - 1]!] = nextValue;
  return root;
}
