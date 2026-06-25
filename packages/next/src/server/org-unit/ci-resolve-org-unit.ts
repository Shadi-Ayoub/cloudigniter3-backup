import { ciNormalizePathname } from "@cloudigniter/core/lib";

import type {
  CiResolveOrgUnitInput,
  CiResolveOrgUnitResult,
} from "@cloudigniter/core/types";

/**
 * Resolves the current Org Unit from the feature pathname.
 *
 * Uses longest-prefix matching so nested Org Units are supported.
 *
 * Example:
 * "/academic/grade-10/math/dashboard"
 *
 * Tries:
 * - "/academic/grade-10/math/dashboard"
 * - "/academic/grade-10/math"
 * - "/academic/grade-10"
 * - "/academic"
 */
export async function ciResolveOrgUnit({
  tenantId,
  featurePathname,
  maxDepth,
  lookupOrgUnit,
}: CiResolveOrgUnitInput): Promise<CiResolveOrgUnitResult> {
  const normalizedPathname = ciNormalizePathname(featurePathname);

  const segments = normalizedPathname.split("/").filter(Boolean);

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

    if (!orgUnit) {
      continue;
    }

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
    featurePathname: normalizedPathname,
  };
}
