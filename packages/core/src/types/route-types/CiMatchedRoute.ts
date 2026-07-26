import type { CiRouteDefinition } from "./CiRouteDefinition";

export type CiMatchedRoute = { pattern: string; route: CiRouteDefinition } | null;
