import type { AbstractIntlMessages } from "next-intl";
import type { ThemeProviderProps } from "next-themes";

import type { CiResolvedConfig } from "@cloudigniter/core";

/**
 * Next.js-extended resolved config.
 */
export type CiNextResolvedConfig<
  TPlatformConfig = unknown,
  TAppConfig = unknown,
> = CiResolvedConfig<TPlatformConfig, TAppConfig> & {
  messages: AbstractIntlMessages;
  themeProviderProps: ThemeProviderProps;
};
