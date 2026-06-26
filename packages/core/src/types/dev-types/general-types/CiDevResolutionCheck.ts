import type { CiDevResolutionCheckState } from "./CiDevResolutionCheckState";

export type CiDevResolutionCheck = {
  id: string;
  area: "tenant" | "orgUnit";
  label: string;
  state: Exclude<CiDevResolutionCheckState, "pending">;
  message: string;
  expected?: Record<string, unknown>;
  actual?: Record<string, unknown>;
};
