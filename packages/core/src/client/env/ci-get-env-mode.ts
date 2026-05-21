import type { CiEnvMode } from "@/types";

export function ciGetEnvMode() {
  const envMode = process.env.NEXT_PUBLIC_CI_ENV_MODE as CiEnvMode;

  return envMode;
}
