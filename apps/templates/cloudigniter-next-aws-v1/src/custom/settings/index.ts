// export { registerCustomSettings } from './settings-extension';

export { extendedSettingsDefaultValues } from "./default-values";
export {
  extendedSettingsZodSchema,
  type ExtendedSettingsFormValues,
} from "./zod-schema";

export type {
  AppSettings,
  AppPrivateExtendedSettings,
  AppPublicExtendedSettings,
  AppUserExtendedSettings,
} from "./types";
