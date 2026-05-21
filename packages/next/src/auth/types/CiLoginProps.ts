import type { CiAuthProviderId } from "@cloudigniter/core/types";

export type CiLoginProps = {
  redirectTo?: string;
  provider?: CiAuthProviderId;
};
