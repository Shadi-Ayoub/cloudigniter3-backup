import type { AbstractIntlMessages } from "next-intl";
import type { ThemeProviderProps } from "next-themes";

/**
 * Next.js-extended resolved config.
 */
export type CiNextResolvedConfig = {
  version: string | undefined;
  routerMode: "App Router" | "Pages Router";
  messages: AbstractIntlMessages;
  appThemeProviderProps: ThemeProviderProps;
};
