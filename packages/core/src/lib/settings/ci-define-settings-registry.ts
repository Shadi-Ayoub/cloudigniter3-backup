import type {
  CiSettingsRegistry,
  CiSettingsRegistryMap,
  CiSettingsScope,
} from "@ci-core/types";

export function ciDefineSettingsRegistry(
  entries: CiSettingsRegistryMap,
): CiSettingsRegistry {
  for (const [id, entry] of Object.entries(entries)) {
    if (
      !/^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*$/.test(id) ||
      ["constructor", "prototype", "__proto__"].includes(id)
    ) {
      throw new Error(`Invalid settings group ID: ${id}`);
    }
    if (!["public", "private", "user"].includes(entry.scope))
      throw new Error(`Invalid settings scope: ${id}`);
    if (entry.defaults && entry.schema) entry.schema.parse(entry.defaults);
  }
  return {
    entries,

    get(settingsId) {
      const entry = Object.hasOwn(entries, settingsId)
        ? entries[settingsId]
        : undefined;

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
