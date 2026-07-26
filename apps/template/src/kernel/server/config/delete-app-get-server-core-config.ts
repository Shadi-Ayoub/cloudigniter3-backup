import "server-only";

import { cache } from "react";

import type { CiNextAwsCoreConfig } from "@/kernel/types";
import rawConfig from "@/../cloudigniter.config";

const ciConfig = rawConfig as CiNextAwsCoreConfig;

/**
 * Returns the full CloudIgniter config.
 *
 * Server-only. Do not import this from Client Components.
 */
export const appGetServerCoreConfig = cache(
  (): CiNextAwsCoreConfig => ciConfig,
);
