import type { CiPrivateCoreSettings } from "./CiPrivateCoreSettings";
import type { CiPublicCoreSettings } from "./CiPublicCoreSettings";
import type { CiUserCoreSettings } from "./CiUserCoreSettings";

export type CiCoreSettings = {
  public: CiPublicCoreSettings;
  private: CiPrivateCoreSettings;
  user: CiUserCoreSettings;
};
