import type { CiLocaleDirection, CiSettings } from "@/types";

export type CiCorePageConfig = {
  settings?: CiSettings;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  locale?: string;
  direction?: CiLocaleDirection;
};
