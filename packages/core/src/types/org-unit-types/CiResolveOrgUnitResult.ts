import type { CiOrgUnitContext } from "./CiOrgUnitContext";

export type CiResolveOrgUnitResult = {
  orgUnit: CiOrgUnitContext | null;
  featurePathname: string;
};
