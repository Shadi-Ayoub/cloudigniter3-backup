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

  if (
    !resolvedOptions.enabled ||
    (envMode !== "development" && !actor.authenticated)
  ) {
    return false;
  }

  if (envMode === "production" && !resolvedOptions.allowProduction) {
    return false;
  }

  const requiredRoles = resolvedOptions.requiredRoles
    .map((role) => role.trim().toUpperCase())
    .filter(Boolean);

  if (envMode !== "development" && requiredRoles.length === 0) {
    return false;
  }

  if (envMode === "development") {
    return true;
  }

  const normalizedRequiredRoles = new Set(
    requiredRoles.map((role) => role.trim().toLowerCase()),
  );

  return actor.roles.some((actorRole) =>
    normalizedRequiredRoles.has(actorRole.trim().toLowerCase()),
  );
}
