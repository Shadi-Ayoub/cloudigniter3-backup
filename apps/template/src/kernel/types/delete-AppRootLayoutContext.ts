import type { CiRootLayoutContext } from "@cloudigniter/core/types";
import type { CiNextResolvedConfig } from "@cloudigniter/next/types";

export type AppRootLayoutContext = CiRootLayoutContext<CiNextResolvedConfig> & {
  next: {
    version: string | undefined;
    routerMode: "App Router" | "Pages Router";
  };

  appNextResolvedConfig: CiNextResolvedConfig;
};
