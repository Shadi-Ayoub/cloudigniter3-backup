import { type ReactNode } from "react";
import type { CiI18nConfig } from "@cloudigniter/core/types";
import type { CiNextThemeConfig } from "@/theme";

export interface CiClientWrapperProps {
  theme: CiNextThemeConfig;
  i18n: CiI18nConfig;
  direction: "ltr" | "rtl";
  protect: boolean;
  children: ReactNode;
}
