// import type { CiPageCoreConfig } from "@cloudigniter/core/client";
import type {
  CiCoreConfig,
  CiResolvedCoreConfig,
  CiSettings,
  CiSystemStatus,
} from "@cloudigniter/core/types";
import type {
  CiNextPageConfig,
  CiNextResolvedConfig,
} from "@cloudigniter/next/types";
// import type { CiNextAwsCoreConfig } from "@/kernel/types";

export function ciPrepareConfig(
  config: CiCoreConfig & CiResolvedCoreConfig & CiNextResolvedConfig,
  settings: CiSettings = {},
  headers: Record<string, string> = {},
  cookies: Record<string, string> = {},
  status: CiSystemStatus = {},
) {
  const obj: CiNextPageConfig = {
    ciConfig: {
      ...config,
    },
    settings,
    headers,
    cookies,
    //status,
  };

  return obj;
}
