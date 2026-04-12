import type { CiAuthProviderId, CiAuthUiConfig } from "../../../";

export type CiAuthConfig = {
  provider?: CiAuthProviderId;
  loginRoute?: string;
  authUi: CiAuthUiConfig;
};
