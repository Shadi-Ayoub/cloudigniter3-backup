import type { CiLocaleDirection } from "@ci-core/types";
import type { CiProfileMenuItem } from "./CiProfileMenuItem";
import type { CiProfileMenuMessages } from "./CiProfileMenuMessages";

export type CiProfileMenuProps = {
  dir: CiLocaleDirection;
  accountItems?: CiProfileMenuItem[];
  inviteItems?: CiProfileMenuItem[];

  /**
   * Provider-specific logout implementation supplied by the authentication
   * integration boundary.
   */
  onLogout: () => void | Promise<void>;

  /**
   * Translated or customized UI messages.
   */
  messages?: Partial<CiProfileMenuMessages>;

  onTeamSelect?: () => void | Promise<void>;
  onNewTeamSelect?: () => void | Promise<void>;
  onGitHubSelect?: () => void | Promise<void>;
  onSupportSelect?: () => void | Promise<void>;
  onApiSelect?: () => void | Promise<void>;

  showTeamSection?: boolean;
  showResourceSection?: boolean;
};
