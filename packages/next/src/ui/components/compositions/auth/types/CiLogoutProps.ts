import type { CiAuthProviderId } from "@cloudigniter/core";

export type CiLogoutProps = {
  redirectTo?: string;
  provider?: CiAuthProviderId;
  className?: string;
  label?: string;
};
