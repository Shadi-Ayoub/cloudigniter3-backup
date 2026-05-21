import type { CiAuthProviderId } from "./CiAuthProviderId";

export type CiLogoutOptions = {
  redirectTo?: string;
  provider?: CiAuthProviderId;
};
