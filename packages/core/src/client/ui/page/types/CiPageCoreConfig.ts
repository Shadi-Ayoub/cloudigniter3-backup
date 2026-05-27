import type { CiSettings } from "@ci-core/types";

export type CiPageCoreConfig = {
  settings?: CiSettings;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
};
