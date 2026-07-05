import type { CiDevResolutionCheckState } from "./CiDevResolutionCheckState";

export type CiDevResolutionCheck = {
  id: string;
  area: "tenant" | "orgUnit";
  label: string;
  state: Exclude<CiDevResolutionCheckState, "pending">;
  message: string;

  /**
   * Full public pathname used by this probe.
   *
   * Examples:
   * - /t/ci-probe-tenant-6f7a2d91-active/dashboard
   * - /t/ci-probe-tenant-6f7a2d91-active/ci-probe-org-.../dashboard
   */
  pathname?: string;

  expected?: Record<string, unknown>;
  actual?: Record<string, unknown>;
};
