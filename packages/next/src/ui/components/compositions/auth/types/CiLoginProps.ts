import type { CiAuthProviderId } from "@cloudigniter/core";

export type CiLoginProps = {
  redirectTo?: string;
  provider?: CiAuthProviderId;
};
