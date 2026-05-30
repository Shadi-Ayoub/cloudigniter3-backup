import type { CiPageCoreConfig } from "@cloudigniter/core/client";
import type { CiSettings, CiSystemStatus } from "@cloudigniter/core/types";
import type { CiNextPageConfig } from "@ci-next/types";

import { ciPrepareConfig } from "./ci-prepare-config";

export async function ciBootstrap(
  config: CiPageCoreConfig,
): Promise<CiNextPageConfig>;
export async function ciBootstrap(
  config: CiPageCoreConfig,
  settings?: CiSettings,
  headers?: Record<string, string>,
  cookies?: Record<string, string>,
  status?: CiSystemStatus,
): Promise<CiNextPageConfig>;
export async function ciBootstrap(
  config: CiPageCoreConfig,
  settings?: CiSettings,
  headers?: Record<string, string>,
  cookies?: Record<string, string>,
  status?: CiSystemStatus,
): Promise<CiNextPageConfig> {
  try {
    let pageConfig: CiNextPageConfig;

    if (settings !== undefined && status !== undefined) {
      pageConfig = ciPrepareConfig(config, settings, headers, cookies, status);
    } else {
      pageConfig = ciPrepareConfig(config);
    }

    return pageConfig;
  } catch (error) {
    throw error; // handled by error.tsx
  }
}
