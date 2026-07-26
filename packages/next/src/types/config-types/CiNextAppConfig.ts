import type { CiInfoPageStrategy, CiPlatformId } from "@cloudigniter/core/types";

export type CiNextAppConfig = {
  platform: CiPlatformId;
  version?: string;
  routerMode?: "App Router" | "Pages Router";
  requestContextCookieName: string;
  requestContextHeaderName: string;
};
