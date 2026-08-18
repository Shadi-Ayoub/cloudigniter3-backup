import type { CiAccessControlDefinition, CiPrivilege } from "../../types";

/** Converts a stable privilege identifier into a readable legacy fallback. */
function createLegacyPrivilegeTitle(privilegeId: unknown): string | undefined {
  if (typeof privilegeId !== "string") return undefined;

  const words = privilegeId
    .trim()
    .split(/[._-]+/u)
    .filter(Boolean)
    .join(" ");
  if (!words) return undefined;

  return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
}

/** Returns whether a persisted privilege predates the required title field. */
function hasMissingPrivilegeTitle(privilege: CiPrivilege): boolean {
  return (privilege as CiPrivilege & { title?: unknown }).title === undefined;
}

/**
 * Adds deterministic titles to privileges persisted before titles were required.
 *
 * Explicitly blank or otherwise invalid titles are preserved so strict catalog
 * validation still reports them. The input definition is never mutated.
 */
export function ciMigrateLegacyPrivilegeTitles(
  definition: CiAccessControlDefinition,
  titleCatalog?: CiAccessControlDefinition
): CiAccessControlDefinition {
  const catalogTitles = new Map(
    (titleCatalog?.roles ?? []).flatMap((role) =>
      role.privileges.map(
        (privilege) =>
          [`${role.id}\u0000${privilege.id}`, privilege.title] as const
      )
    )
  );
  let changed = false;
  const roles = definition.roles.map((role) => {
    let roleChanged = false;
    const privileges = role.privileges.map((privilege) => {
      if (!hasMissingPrivilegeTitle(privilege)) return privilege;

      const title =
        catalogTitles.get(`${role.id}\u0000${privilege.id}`) ??
        createLegacyPrivilegeTitle(privilege.id);
      if (!title) return privilege;

      changed = true;
      roleChanged = true;
      return { ...privilege, title };
    });

    return roleChanged ? { ...role, privileges } : role;
  });

  return changed ? { ...definition, roles } : definition;
}
