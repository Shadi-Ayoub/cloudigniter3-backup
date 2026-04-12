import type { CiEnvMode } from "@/.";

export function getEnvMode() {
  const envMode = process.env.NEXT_PUBLIC_CI_ENV_MODE as CiEnvMode;

  return envMode;
}
