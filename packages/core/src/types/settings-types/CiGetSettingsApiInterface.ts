import type { CiAuthMode } from "../auth-types";
import type { CiSettingsScope, CiSettingsId } from "./index";

export interface CiGetSettingsApiInterface {
  authMode: CiAuthMode;
  tenantId?: string;
  userId?: string;

  publicSettingIds?: CiSettingsId[];
  privateSettingIds?: CiSettingsId[];
  userSettingIds?: CiSettingsId[];

  /**
   * Optional current pathname used to resolve matching route-scoped settings.
   * Route resolution happens in the backend service.
   */
  pathname?: string;

  /**
   * Optional explicit route settings ids.
   * When provided, backend may use them instead of resolving from pathname.
   */
  routeSettingIds?: CiSettingsId[];

  /**
   * Requested persisted scopes.
   * Route-scoped settings are resolved separately in the backend.
   */
  include?: CiSettingsScope[];
}
