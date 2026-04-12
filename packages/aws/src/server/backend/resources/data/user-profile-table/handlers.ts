export const USER_PROFILE_TABLE_HANDLERS = [
  'ciGetUserProfileHandler',
  'ciCreateUserProfileHandler',
  'ciUpdateUserProfileHandler',
  'ciDeleteUserProfileHandler',
] as const;

export type CiUserProfileTableHandlers = (typeof USER_PROFILE_TABLE_HANDLERS)[number];
