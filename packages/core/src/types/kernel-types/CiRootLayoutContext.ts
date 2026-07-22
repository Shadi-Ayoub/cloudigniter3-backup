import type { CiLocaleDirection } from "@ci-core/types";
import type { CiResolvedCoreConfig } from "./CiResolvedCoreConfig";

export type CiRootLayoutContext = {
  htmlProps: {
    lang: string;
    dir: CiLocaleDirection;
    suppressHydrationWarning?: boolean;
  };

  bodyProps: {
    className: string;
  };

  debugProbe: {
    id: string;
    title: string;
    enabled: boolean;
    options: {
      visible: boolean;
      x: number;
      y: number;
    };
    data: {
      component: string;
      lang: string;
      dir: CiLocaleDirection;
      bodyClassName: string;
    };
  };
};
