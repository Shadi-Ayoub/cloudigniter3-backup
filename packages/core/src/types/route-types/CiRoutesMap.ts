import type { CiRouteDefinition } from "./CiRouteDefinition";
import type { CiRoutePattern } from "./CiRoutePattern";

export type CiRoutesMap = Readonly<Record<CiRoutePattern, CiRouteDefinition>>;

// import type { CiRoute } from "./CiRoute";

// export type CiRoutesMap = Record<string, CiRoute>;
