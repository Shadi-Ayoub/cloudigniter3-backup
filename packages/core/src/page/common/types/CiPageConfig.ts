import type { CiSettings } from "../../../";

export type CiPageConfig = {
  settings?: CiSettings;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
};
