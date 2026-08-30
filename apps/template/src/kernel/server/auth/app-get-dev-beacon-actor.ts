import type { CiDevBeaconActor } from "@cloudigniter/core/types";
import { appGetCurrentUser } from "../api/users/app-get-current-user";

/**
 * Resolves Dev Beacon access attributes directly from the authenticated
 * provider session. This helper is also used by `/ci-internal` diagnostics,
 * whose requests intentionally bypass Proxy and therefore cannot bootstrap a
 * page request context.
 *
 * The shared developer-tools gate performs the final decision.
 */
export async function appGetDevBeaconActor(): Promise<CiDevBeaconActor> {
  const currentUser = await appGetCurrentUser();

  return {
    authenticated: currentUser.isAuthenticated,
    roles: currentUser.groups,
  };
}
