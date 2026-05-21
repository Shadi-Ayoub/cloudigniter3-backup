import type {
  CiSettingsRegistry,
  CiSettingsRegistryMap,
  CiSettingsScope,
} from "@/types";

export function ciDefineSettingsRegistry(
  entries: CiSettingsRegistryMap,
): CiSettingsRegistry {
  return {
    entries,

    get(settingsId) {
      const entry = entries[settingsId];

      if (!entry) {
        throw new Error(`Unknown settingsId: ${settingsId}`);
      }

      return entry;
    },

    list() {
      return entries;
    },

    listByScope(scope: CiSettingsScope) {
      return Object.fromEntries(
        Object.entries(entries).filter(([, entry]) => entry.scope === scope),
      );
    },
  };
}
