import type { CiConfig } from "../";

/**
 * Framework-agnostic resolved CloudIgniter config.
 *
 * This type contains only values that are generic enough to be shared
 * across platform, framework, and runtime implementations.
 */
export type CiResolvedConfig<
  TPlatformConfig = unknown,
  TAppConfig = unknown,
> = CiConfig<TPlatformConfig, TAppConfig> & {
  locale: string;
  direction: "ltr" | "rtl";
};
