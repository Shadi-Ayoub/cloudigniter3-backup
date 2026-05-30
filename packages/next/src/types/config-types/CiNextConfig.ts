import type { CiInfoPageStrategy } from "@cloudigniter/core/types";

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
