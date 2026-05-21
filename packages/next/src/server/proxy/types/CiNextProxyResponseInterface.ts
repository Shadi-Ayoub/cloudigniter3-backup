import type { NextRequest } from "next/server";
import type { CiCoreConfig, CiRoute } from "@cloudigniter/core/types";

export interface CiNextProxyResponseInterface {
  request: NextRequest;
  ciConfig: CiCoreConfig;
  routes: Record<string, CiRoute>;
}
