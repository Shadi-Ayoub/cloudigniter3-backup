import type { CiInfoPageStrategy } from "@cloudigniter/core/client";

export type CiNextConfig = {
  loginRoute?: string;

  route?: {
    namespaceCookieName?: string;
    namespaceHeaderName?: string;
    pathnameCookieName?: string;
    pathnameHeaderName?: string;
    infoPageStrategy?: CiInfoPageStrategy;
  };
};
