import type { CiDeveloperToolsAccessInput } from "@ci-core/types";

export const CI_DEFAULT_DEVELOPER_TOOLS_REQUIRED_ROLES = Object.freeze([
  "developer",
] as const);

/**
 * Returns whether an actor may use a development-only CloudIgniter capability.
 *
 * All conditions are mandatory: the capability is enabled, the runtime mode is
 * exactly `development`, the actor is authenticated, and one configured role
 * ID matches exactly. This helper is suitable for presentation gating, but a
 * trusted mutation boundary must repeat the same authorization decision.
 */
export function ciCanAccessDeveloperTools({
  envMode,
  actor,
  options,
}: CiDeveloperToolsAccessInput): boolean {
  if (options?.enabled === false) {
    return false;
  }

  if (envMode !== "development" || !actor.authenticated) {
    return false;
  }

  const requiredRoles =
    options?.requiredRoles ?? CI_DEFAULT_DEVELOPER_TOOLS_REQUIRED_ROLES;
  const requiredRoleIds = new Set(
    requiredRoles.map((role) => role.trim()).filter(Boolean),
  );

  if (requiredRoleIds.size === 0) {
    return false;
  }

  return actor.roles.some((role) => requiredRoleIds.has(role.trim()));
}
