import type { CiAccessRequirement } from "../auth-types";

/** Declarative route metadata used by route resolution and enforcement layers. */
export interface CiRouteDefinition {
  title: string;
  namespace: string;
  protected: boolean;

  /**
   * Optional resource/action requirement for an authorization middleware.
   *
   * The route is an enforcement point; the referenced resource remains part
   * of the independent access-control catalog.
   */
  access?: CiAccessRequirement;
}
