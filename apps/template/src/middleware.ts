import type { NextRequest } from 'next/server';

import type { CiConfig } from '@cloudigniter/next/types';

import ciConfig from '@/../cloudigniter.config';

import {
  nextMiddlewareMatcher,
  nextMiddlewareResponse,
} from '@cloudigniter/next/middleware';

const ciConf = ciConfig as CiConfig;

export async function middleware(request: NextRequest) {
  const res = await nextMiddlewareResponse({
    request,
    ciConfig,
    routes: ciConf.routes,
  });

  return res;
}

export const config = {
  matcher: [nextMiddlewareMatcher],
};
