import { ciMergeRouteMaps } from "@cloudigniter/core/lib";
import type { CiRoutesMap } from "@cloudigniter/core/types";

import { resourceStudioRoutes } from "./resource-studio.generated";

/** Hand-written application routes. Resource Studio never rewrites this map. */
const manualCustomRoutes = {
  "/auth-test": {
    title: "Test Authentication",
    namespace: "testing",
    protected: true,
  },
  "/test": { title: "Test Page", namespace: "test", protected: true },
} satisfies CiRoutesMap;

export const customRoutes = ciMergeRouteMaps(
  manualCustomRoutes,
  resourceStudioRoutes,
);
