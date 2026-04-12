import type { CiEnvMap } from '../core-types/env';
import type { CiCoreFunctionId } from '../core-types/functions';
import type { CiResourceEnvKeyAllowlist } from './resource-module.types';

export function ciBuildEnvMapFromAllowlist(
  allowlist: CiResourceEnvKeyAllowlist,
  envValues: Record<string, string | undefined>
): CiEnvMap {
  const result: CiEnvMap = {};

  for (const [handler, keys] of Object.entries(allowlist)) {
    if (!keys?.length) continue;

    const entries = keys.flatMap((key) => {
      const value = envValues[key];
      return value === undefined ? [] : [[key, value] as const];
    });

    result[handler as CiCoreFunctionId] = Object.fromEntries(entries);
  }

  return result;
}

export type CiFunctionEnvMap = CiEnvMap;

export function ciMergeEnvMaps(...maps: CiFunctionEnvMap[]): CiFunctionEnvMap {
  const merged: CiFunctionEnvMap = {};

  for (const map of maps) {
    for (const [handler, env] of Object.entries(map)) {
      const fnId = handler as CiCoreFunctionId;
      merged[fnId] = {
        ...(merged[fnId] ?? {}),
        ...(env ?? {}),
      };
    }
  }

  return merged;
}
