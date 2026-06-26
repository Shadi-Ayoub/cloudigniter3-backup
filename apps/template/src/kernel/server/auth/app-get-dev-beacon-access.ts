import {
  CI_DEFAULT_DEV_BEACON_OPTIONS,
  ciCanAccessDevBeacon,
} from "@cloudigniter/core/lib";

import type { CiDevBeaconOptions, CiEnvMode } from "@ci-core/types";

import { appGetDevBeaconActor } from "./app-get-dev-beacon-actor";

export async function appGetDevBeaconAccess(
  options?: CiDevBeaconOptions,
): Promise<{
  allowed: boolean;
}> {
  const actor = await appGetDevBeaconActor();

  const envMode = (process.env.CI_ENV_MODE ??
    process.env.NEXT_PUBLIC_CI_ENV_MODE ??
    "test") as CiEnvMode;

  const resolvedOptions = {
    ...CI_DEFAULT_DEV_BEACON_OPTIONS,
    ...(options ?? {}),
  };

  return {
    allowed: ciCanAccessDevBeacon({
      options: resolvedOptions,
      envMode,
      actor,
    }),
  };
}
