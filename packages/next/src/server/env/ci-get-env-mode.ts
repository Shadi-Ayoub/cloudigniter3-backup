import type { CiEnvMode } from "@cloudigniter/core/types";

export function ciGetEnvMode(): CiEnvMode | undefined {
  const envMode = (process.env.CI_ENV_MODE ??
    process.env.NEXT_PUBLIC_CI_ENV_MODE) as CiEnvMode | undefined;

  return envMode;
}
