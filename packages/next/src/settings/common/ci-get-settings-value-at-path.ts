import type { CiSettings, CiSettingsValue } from './types';

/**
 * Read a nested settings value from a dot-separated path.
 *
 * @param value - Settings object to read from.
 * @param path - Dot-separated path.
 * @returns Matching nested value, or `undefined` if not found.
 */
export function ciGetSettingsValueAtPath(
  value: CiSettings,
  path: string,
): CiSettingsValue | undefined {
  const parts = path.split('.').filter(Boolean);
  let current: CiSettingsValue = value;

  for (const part of parts) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      return undefined;
    }

    current = (current as Record<string, CiSettingsValue>)[part];
  }

  return current;
}
