/** Authenticated actor attributes used to gate development-only capabilities. */
export type CiDeveloperToolsActor = {
  authenticated: boolean;
  roles: readonly string[];
};
