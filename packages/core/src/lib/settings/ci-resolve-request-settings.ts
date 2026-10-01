import type {
  CiSettingsActor,
  CiSettingsRegistry,
  CiSettingsGroup,
  CiRequestSettings,
} from "@ci-core/types";

/** Shared selective loading contract; transport and persistence remain injected. */
export async function ciResolveRequestSettings(
  registry: CiSettingsRegistry,
  actor: CiSettingsActor,
  read: (id: string) => Promise<CiSettingsGroup>,
  ids: readonly string[] = [],
  cookies: Readonly<Record<string, string>> = {},
): Promise<CiRequestSettings> {
  const selected = new Set(ids);
  for (const id of selected) registry.get(id);
  for (const [id, entry] of Object.entries(registry.list()))
    if (entry.alwaysLoad) selected.add(id);
  const eligible = [...selected].filter(
    (id) =>
      registry.get(id).scope === "public" || (actor.authenticated && actor.id),
  );
  const groups = await Promise.all(eligible.map((id) => read(id)));
  const snapshot: CiRequestSettings = {};
  for (const group of groups) {
    const value = { ...group.value };
    for (const [field, name] of Object.entries(
      registry.get(group.id).cookies ?? {},
    )) {
      if (Object.hasOwn(cookies, name)) value[field] = cookies[name]!;
    }
    (snapshot[group.scope] ??= {})[group.id] = value;
  }
  return snapshot;
}
