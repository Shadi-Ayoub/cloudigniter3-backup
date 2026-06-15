import { type ReactNode } from "react";
import type {
  CiDevConfig,
  CiI18nConfig,
  CiLocale,
} from "@cloudigniter/core/types";
import type { CiNextThemeConfig } from "@ci-next/types";

export interface CiClientWrapperProps {
  themeConfig: CiNextThemeConfig;
  i18nConfig: CiI18nConfig;
  locale: CiLocale;
  devConfig: CiDevConfig;
  protect: boolean;
  children: ReactNode;
}
