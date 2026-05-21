import type { NextRequest } from "next/server";
import type { CiCoreConfig } from "@cloudigniter/core/types";
import type { CiAwsProviderConfig } from "@cloudigniter/aws";
import type { CiNextConfig } from "@cloudigniter/next";

import ciConfig from "./cloudigniter.config";

import {
  // ciNextProxyMatcher,
  ciNextProxyResponse,
} from "@cloudigniter/next/server";

const conf = ciConfig as CiCoreConfig & CiAwsProviderConfig & CiNextConfig;

// const ciConf = ciConfig as CiConfig;

export async function proxy(request: NextRequest) {
  const res = await ciNextProxyResponse({
    request,
    ciConfig,
    routes: conf.routes,
  });

  return res;
}

export const config = {
  matcher: [
    "/((?!api|ci-internal|_next/static|_next/image|_next/webpack-hmr|favicon.ico|robots.txt|sitemap.xml|.*\\.[\\w-]+).*)",
  ],
};
