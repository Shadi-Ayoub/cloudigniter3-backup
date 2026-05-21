import type { CiSettings } from "@/types";

export type CiPageCoreConfig = {
  settings?: CiSettings;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
};
