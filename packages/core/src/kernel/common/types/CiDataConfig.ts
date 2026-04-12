import type { CiPublicAuthMode } from "../../../";

/**
 * Data-layer runtime config.
 *
 * Keeps framework/core config neutral by only describing the
 * authentication mode expected for public data access.
 */
export type CiDataConfig = {
  /**
   * Public-facing auth mode used when no authenticated user context is available.
   * Example values may include "apiKey", "iam", or any platform-specific mode
   * represented by CiPublicAuthMode.
   */
  publicAuthMode: CiPublicAuthMode;
};
