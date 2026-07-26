import type { CiAuthProviderId, CiLocaleDirection } from "@cloudigniter/core/types";
import type { CiNextConfig } from "@ci-next/types";

export type CiNextProfileMenuProps = {
  config: CiNextConfig;
  dir: CiLocaleDirection;

  /**
   * Authentication provider used to resolve the provider-specific
   * profile-menu integration.
   *
   * Defaults to "aws".
   */
  provider?: CiAuthProviderId;
};
