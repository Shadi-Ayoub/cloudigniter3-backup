import type { NextRequest } from "next/server";
import type { CiCoreConfig } from "@cloudigniter/core/types";
import type { CiAwsProviderConfig } from "@cloudigniter/aws/types";
import type { CiNextConfig } from "@cloudigniter/next/types";
import { getConfig } from "@/kernel";

// import ciConfig from "../cloudigniter.config";

import {
  // ciNextProxyMatcher,
  ciNextProxyResponse,
} from "@cloudigniter/next/server/proxy";

// const conf = ciConfig as CiCoreConfig & CiAwsProviderConfig & CiNextConfig;

// const ciConf = ciConfig as CiConfig;

const conf = getConfig();

export async function proxy(request: NextRequest) {
  const res = await ciNextProxyResponse({
    request,
    ciConfig: conf,
    routes: conf.routes,
  });

  return res;
}

export const config = {
  matcher: [
    "/((?!api|ci-internal|_next/static|_next/image|_next/webpack-hmr|favicon.ico|robots.txt|sitemap.xml|.*\\.[\\w-]+).*)",
  ],
};
