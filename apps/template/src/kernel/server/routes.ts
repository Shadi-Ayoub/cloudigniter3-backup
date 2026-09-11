import { ciGetRoutes } from "@cloudigniter/core/lib";

import { customRoutes } from "../../custom/routes";

/**
 * Application route composition. Core definitions remain package-owned while
 * hand-written and Resource Studio routes remain under src/custom.
 */
export const routes = ciGetRoutes(customRoutes);
