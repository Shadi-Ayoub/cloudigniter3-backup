import { ciDefineSettingsRegistry } from "./ci-define-settings-registry";
import {
  ciDefaultPrivateCoreSettings,
  ciDefaultPublicCoreSettings,
  ciDefaultUserCoreSettings,
} from "./defaults";
import {
  CiPrivateCoreSettingsSchema,
  CiPublicCoreSettingsSchema,
  CiUserCoreSettingsSchema,
} from "./schemata";
import type { CiSettingsRegistryMap } from "@ci-core/types";

export function ciCreateCoreSettingsRegistry(
  extensions: CiSettingsRegistryMap = {},
) {
  return ciDefineSettingsRegistry({
    public: {
      scope: "public",
      defaults: ciDefaultPublicCoreSettings,
      schema: CiPublicCoreSettingsSchema,
      allowClientRead: true,
      allowClientWrite: false,
    },
    private: {
      scope: "private",
      defaults: ciDefaultPrivateCoreSettings,
      schema: CiPrivateCoreSettingsSchema,
      allowClientRead: false,
      allowClientWrite: false,
    },
    user: {
      scope: "user",
      defaults: ciDefaultUserCoreSettings,
      schema: CiUserCoreSettingsSchema,
      allowClientRead: true,
      allowClientWrite: true,
    },
    ...extensions,
  });
}
