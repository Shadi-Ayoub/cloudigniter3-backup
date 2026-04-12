import { deepmerge } from "deepmerge-ts";
import type { CiEnvMap } from "../core-types";

/**
 * Deep merge multiple CiEnvMap fragments.
 *
 * Unlike object spread, this preserves env fragments for handlers
 * that appear in multiple maps (e.g. ciGetSettingsHandler).
 *
 * Example:
 *
 * map1:
 *   ciGetSettingsHandler -> { CI_PUBLIC_SETTINGS_TABLE_NAME }
 *
 * map2:
 *   ciGetSettingsHandler -> { CI_PRIVATE_SETTINGS_TABLE_NAME }
 *
 * Result:
 *   ciGetSettingsHandler -> {
 *      CI_PUBLIC_SETTINGS_TABLE_NAME,
 *      CI_PRIVATE_SETTINGS_TABLE_NAME
 *   }
 */
export function ciMergeEnvMaps(
  ...maps: Array<CiEnvMap | undefined | null>
): CiEnvMap {
  const validMaps = maps.filter((map): map is CiEnvMap => Boolean(map));

  if (validMaps.length === 0) {
    return {};
  }

  return deepmerge(...validMaps) as CiEnvMap;
}
