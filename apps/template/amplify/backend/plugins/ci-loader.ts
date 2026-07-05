import { extendedResources } from "../../custom";
import { coreResources, type CoreBackendKeys } from "../backend-core";

type ExtendedResources = typeof extendedResources;

/**
 * Merge core and extended backend resources safely
 */
export function ciLoadMergedBackendResources(): typeof coreResources &
  ExtendedResources {
  const conflicts = Object.keys(extendedResources).filter(
    (key): key is CoreBackendKeys => key in coreResources,
  );

  if (conflicts.length > 0) {
    throw new Error(
      `Extension conflict: The following resource keys already exist in core and cannot be overridden: ${conflicts.join(
        ", ",
      )}`,
    );
  }

  return {
    ...coreResources,
    ...extendedResources,
  };
}
