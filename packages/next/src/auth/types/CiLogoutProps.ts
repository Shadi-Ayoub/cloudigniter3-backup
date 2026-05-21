import type { CiAuthProviderId } from "@cloudigniter/core/types";

export type CiLogoutProps = {
  redirectTo?: string;
  provider?: CiAuthProviderId;
  className?: string;
  label?: string;
};
