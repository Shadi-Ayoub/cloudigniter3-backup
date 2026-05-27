import type { CiLocaleDirection, CiSettings } from "@ci-core/types";

export type CiCorePageConfig = {
  settings?: CiSettings;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  locale?: string;
  direction?: CiLocaleDirection;
};
