import type { CiAuthProviderId } from "./CiAuthProviderId";
import type { CiAuthUiConfig } from "./CiAuthUiConfig";
import type { CiEmberguardConfig } from "./emberguard-types";

export type CiAuthConfig = {
  /** Authentication provider binding. */
  provider?: CiAuthProviderId;

  /** Application login route. */
  loginRoute?: string;

  /** Authentication user-interface behavior. */
  authUi: CiAuthUiConfig;

  /** Provider-neutral authorization and access-control configuration. */
  emberguard?: CiEmberguardConfig;
};
