// import type { CiPageCoreConfig } from "@cloudigniter/core/client";
import type {
  CiCoreConfig,
  CiResolvedCoreConfig,
  CiCoreSettings,
  CiSystemStatus,
} from "@cloudigniter/core/types";
import type {
  CiNextPageConfig,
  CiNextResolvedConfig,
} from "@cloudigniter/next/types";
// import type { CiNextAwsCoreConfig } from "@/kernel/types";

export function ciPrepareConfig(
  coreConfig: CiCoreConfig,
  resolvedCoreConfig: CiResolvedCoreConfig,
  nextResolvedConfig: CiNextResolvedConfig,
  settings: CiCoreSettings,
  headers: Record<string, string> = {},
  cookies: Record<string, string> = {},
  status: CiSystemStatus = {},
) {
  const obj: CiNextPageConfig = {
    coreConfig,
    resolvedCoreConfig,
    nextResolvedConfig,
    settings,
    headers,
    cookies,
    //status,
  };

  return obj;
}
