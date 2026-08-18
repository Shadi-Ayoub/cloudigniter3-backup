// src/kernel/server/auth/app-get-dev-beacon-actor.ts

import type { CiDevBeaconActor } from "@cloudigniter/core/types";

/**
 * Temporary Dev Beacon actor resolver.
 *
 * Replace with the Attribute Role-based Access Control resolver.
 */
export async function appGetDevBeaconActor(): Promise<CiDevBeaconActor> {
  return {
    authenticated: true,
    roles: ["developer"],
  };
}
