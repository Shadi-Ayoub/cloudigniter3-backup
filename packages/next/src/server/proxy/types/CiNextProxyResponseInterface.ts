import type { NextRequest } from "next/server";
import type { CiRoutesMap } from "@cloudigniter/core/types";
import type { CiNextCoreConfig } from "@ci-next/types";

export interface CiNextProxyResponseInterface {
  request: NextRequest;
  config: CiNextCoreConfig;
  routes: CiRoutesMap;
}
