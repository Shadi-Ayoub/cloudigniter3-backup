import { ciNormalizePathname } from "@cloudigniter/core/lib";

import type {
  CiResolveOrgUnitInput,
  CiResolveOrgUnitResult,
} from "@cloudigniter/core/types";

export async function ciResolveOrgUnit({
  tenantId,
  featurePathname,
  maxDepth,
  lookupOrgUnit,
}: CiResolveOrgUnitInput): Promise<CiResolveOrgUnitResult> {
  const normalizedFeaturePathname = ciNormalizePathname(featurePathname);
  const segments = normalizedFeaturePathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return {
      orgUnit: null,
      featurePathname: "/",
    };
  }

  const maxSegmentsToTry = Math.min(segments.length, Math.max(1, maxDepth));

  for (let depth = maxSegmentsToTry; depth >= 1; depth -= 1) {
    const candidateOrgUnitPath = ciNormalizePathname(
      `/${segments.slice(0, depth).join("/")}`,
    );

    const orgUnit = await lookupOrgUnit(tenantId, candidateOrgUnitPath);

    if (!orgUnit) continue;

    const remainingSegments = segments.slice(depth);

    return {
      orgUnit,
      featurePathname:
        remainingSegments.length > 0
          ? ciNormalizePathname(`/${remainingSegments.join("/")}`)
          : "/",
    };
  }

  return {
    orgUnit: null,
    featurePathname: normalizedFeaturePathname,
  };
}
