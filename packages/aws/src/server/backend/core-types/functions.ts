export const CI_AUTH_FUNCS_IDS = ['ciGetCognitoUserHandler', 'ciCreateCognitoUserHandler'] as const;

export const CI_DATA_FUNCS_IDS = [
  'ciGetSettingsHandler',
  'ciSetSettingsHandler',
  'ciClearSeederHandler',
  'ciCreateTenantHandler',
  'ciDeleteTenantHandler',
  'ciGetTenantHandler',
  'ciGetTenantBySlugHandler',
  'ciGetTenantLookupBySlugHandler',
  'ciListTenantsHandler',
  'ciSeedTenantsHandler',
  'ciUpdateTenantHandler',
  'ciGetUserProfileHandler',
  'ciCreateUserProfileHandler',
  'ciUpdateUserProfileHandler',
  'ciDeleteUserProfileHandler',
] as const;

/**
 * Core backend function ids.
 *
 * Keep this union synchronized with the handlers exported by registered
 * resource modules.
 */
export type CiCoreFunctionId = (typeof CI_AUTH_FUNCS_IDS)[number] | (typeof CI_DATA_FUNCS_IDS)[number];
