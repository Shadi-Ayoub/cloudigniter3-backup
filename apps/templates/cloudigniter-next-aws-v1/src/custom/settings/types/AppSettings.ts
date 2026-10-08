import type { CiAppSettings } from "@cloudigniter/core/types";
import type { AppPrivateExtendedSettings } from "./AppPrivateExtendedSettings";
import type { AppPublicExtendedSettings } from "./AppPublicExtendedSettings";
import type { AppUserExtendedSettings } from "./AppUserExtendedSettings";

export type AppSettings = CiAppSettings<
  AppPublicExtendedSettings,
  AppPrivateExtendedSettings,
  AppUserExtendedSettings
>;
