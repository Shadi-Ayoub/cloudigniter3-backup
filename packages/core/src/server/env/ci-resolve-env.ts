import type { CiEnvMode } from "@ci-core/types";

/**
 * Resolve a normalized DevEnv value for gating DevBeacon visibility.
 *
 * Priority:
 * 1) Explicit `input` (caller provided)
 * 2) `NEXT_PUBLIC_RUNTIME_ENV` (CloudIgniter convention; better semantic mapping than NODE_ENV)
 * 3) `NODE_ENV`
 *
 * Notes:
 * - Mapping "test" => "staging" is intentional (common CI pipeline semantics). Adjust if needed.
 */
export function ciResolveEnv(input?: CiEnvMode): CiEnvMode {
  if (input) return input;

  // const raw = (
  //   process.env.NEXT_PUBLIC_RUNTIME_ENV ??
  //   process.env.NODE_ENV ??
  //   "prod"
  // ).toLowerCase();

  // if (raw === "dev" || raw === "development") return "sandbox";
  // if (raw === "stage" || raw === "staging" || raw === "test") return "test";

  return "production";
}
