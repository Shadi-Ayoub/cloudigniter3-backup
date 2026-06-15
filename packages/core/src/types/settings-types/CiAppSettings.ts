import type { CiCoreSettings } from "./CiCoreSettings";

export type CiAppSettings<
  TPublicExtendedSettings = unknown,
  TPrivateExtendedSettings = unknown,
  TUserExtendedSettings = unknown,
> = {
  core: CiCoreSettings;
  public?: TPublicExtendedSettings;
  private?: TPrivateExtendedSettings;
  user?: TUserExtendedSettings;
};
