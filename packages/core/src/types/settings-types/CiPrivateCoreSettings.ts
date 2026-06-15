import type {
  CiEmailSettings,
  CiMainMenuItem,
  CiSecuritySettings,
} from "@ci-core/types";

export type CiPrivateCoreSettings = {
  security: CiSecuritySettings;
  email: CiEmailSettings;
  mainMenu: CiMainMenuItem[];
};
