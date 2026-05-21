import type { AbstractIntlMessages } from "next-intl";
import type { ThemeProviderProps } from "next-themes";

/**
 * Next.js-extended resolved config.
 */
export type CiNextResolvedConfig = {
  messages: AbstractIntlMessages;
  themeProviderProps: ThemeProviderProps;
};
