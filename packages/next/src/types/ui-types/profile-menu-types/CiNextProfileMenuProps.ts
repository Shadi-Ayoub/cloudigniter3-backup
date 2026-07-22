import type {
  CiAuthProviderId,
  CiLocaleDirection,
} from "@cloudigniter/core/types";
import type { CiNextPageConfig } from "@ci-next/types";

export type CiNextProfileMenuProps = {
  config: CiNextPageConfig;
  dir: CiLocaleDirection;

  /**
   * Authentication provider used to resolve the provider-specific
   * profile-menu integration.
   *
   * Defaults to "aws".
   */
  provider?: CiAuthProviderId;
};
