import type { CiLocaleDirection } from "@ci-core/types";
/**
 * Framework-agnostic resolved CloudIgniter config.
 *
 * This type contains only values that are generic enough to be shared
 * across platform, framework, and runtime implementations.
 */
export type CiResolvedCoreConfig = {
  locale: string;
  direction: CiLocaleDirection;
  languageDiagnosticsEndpoint?: string;
};
