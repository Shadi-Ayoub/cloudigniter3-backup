import type { CiCoreSettings } from "@ci-core/types";

export type CiPageCoreConfig = {
  settings?: CiCoreSettings;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
};
