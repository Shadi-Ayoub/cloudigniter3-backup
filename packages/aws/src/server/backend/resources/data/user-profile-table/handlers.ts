/**
 * Planned User Profile CRUD IDs retained for compatibility. They become
 * deployable only after implementations are registered in both manifests.
 */
export const USER_PROFILE_TABLE_HANDLERS = [
  "ciGetUserProfileHandler",
  "ciCreateUserProfileHandler",
  "ciUpdateUserProfileHandler",
  "ciDeleteUserProfileHandler",
] as const;

export type CiUserProfileTableHandlers =
  (typeof USER_PROFILE_TABLE_HANDLERS)[number];
