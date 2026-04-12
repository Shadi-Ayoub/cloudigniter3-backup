import type { CiAuthProviderId } from "./CiAuthProviderId";

export type CiLoginOptions = {
  redirectTo?: string;
  provider?: CiAuthProviderId;
};
