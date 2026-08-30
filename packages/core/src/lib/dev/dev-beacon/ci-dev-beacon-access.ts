import type { CiDevBeaconAccessInput } from "@ci-core/types";
import { ciCanAccessDeveloperTools } from "../developer-tools";
import { CI_DEFAULT_DEV_BEACON_OPTIONS } from "./constants";

/**
 * Determines whether the current authenticated actor can access the Dev Beacon.
 *
 * Access requires:
 * - Dev Beacon enabled
 * - authenticated actor
 * - runtime mode is exactly `development`
 * - at least one exact matching configured role
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

  return ciCanAccessDeveloperTools({
    envMode,
    actor,
    options: {
      enabled: resolvedOptions.enabled,
      requiredRoles: resolvedOptions.requiredRoles,
    },
  });
}
