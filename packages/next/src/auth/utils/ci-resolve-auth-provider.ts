import type { CiAuthProviderId } from "@cloudigniter/core/types";

/**
 * Resolve the auth provider to use in the Next UI layer.
 *
 * For now, AWS is the default.
 */
export function ciResolveAuthProvider(
  provider?: CiAuthProviderId,
): CiAuthProviderId {
  return provider ?? "aws";
}
