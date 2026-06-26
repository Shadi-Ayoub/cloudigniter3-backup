import type { CiDevBeaconAccessInput } from "@ci-core/types";
import { CI_DEFAULT_DEV_BEACON_OPTIONS } from "./constants";

/**
 * Determines whether the current authenticated actor can access the Dev Beacon.
 *
 * Access requires:
 * - Dev Beacon enabled
 * - authenticated actor
 * - production explicitly allowed when applicable
 * - at least one matching configured role
 */
export function ciCanAccessDevBeacon({
  options,
  envMode,
  actor,
}: CiDevBeaconAccessInput): boolean {
  const resolvedOptions = {
    ...CI_DEFAULT_DEV_BEACON_OPTIONS,
    ...(options ?? {}),
  };

  if (!resolvedOptions.enabled || !actor.authenticated) {
    return false;
  }

  if (envMode === "production" && !resolvedOptions.allowProduction) {
    return false;
  }

  const requiredRoles = resolvedOptions.requiredRoles
    .map((role) => role.trim().toUpperCase())
    .filter(Boolean);

  if (requiredRoles.length === 0) {
    return false;
  }

  return actor.roles.some((actorRole) =>
    requiredRoles.includes(actorRole.trim().toUpperCase()),
  );
}
