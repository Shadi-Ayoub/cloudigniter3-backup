import type {
  CiInfoPageStrategy,
  CiPlatformId,
} from "@cloudigniter/core/types";

export type CiNextAppConfig = {
  platform: CiPlatformId;
  version?: string;
  routerMode?: "App Router" | "Pages Router";
  route?: {
    namespaceCookieName?: string;
    namespaceHeaderName?: string;
    pathnameCookieName?: string;
    pathnameHeaderName?: string;
    infoPageStrategy?: CiInfoPageStrategy;
  };
};
