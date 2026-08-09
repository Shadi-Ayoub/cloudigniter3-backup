export const CI_AUTH_FUNCS_IDS = [
  "ciGetCognitoUserHandler",
  "ciCreateCognitoUserHandler",
  "ciSetCognitoUserPasswordHandler",
] as const;

export const CI_DATA_FUNCS_IDS = [
  "ciGetSettingsHandler",
  "ciSetSettingsHandler",
  "ciClearSeederHandler",
  "ciCreateTenantHandler",
  "ciDeleteTenantHandler",
  "ciGetTenantHandler",
  "ciGetTenantBySlugHandler",
  "ciGetTenantLookupBySlugHandler",
  "ciListTenantsHandler",
  "ciSeedTenantsHandler",
  "ciUpdateTenantHandler",
  "ciGetUserProfileHandler",
  "ciCreateUserProfileHandler",
  "ciUpdateUserProfileHandler",
  "ciDeleteUserProfileHandler",
  "ciGetEmberguardDefinitionHandler",
  "ciSetEmberguardDefinitionHandler",
  "ciListEmberguardRoleAssignmentsHandler",
  "ciPutEmberguardRoleAssignmentHandler",
  "ciDeleteEmberguardRoleAssignmentHandler",
  "ciListEmberguardResourceInventoryHandler",
  "ciPutEmberguardResourceInventoryHandler",
  "ciListEmberguardCustomDomainsHandler",
  "ciPutEmberguardCustomDomainHandler",
  "ciDeleteEmberguardCustomDomainHandler",
] as const;

/**
 * Known core backend function ids, including planned compatibility IDs.
 *
 * Use `CI_CORE_BACKEND_MANIFEST.handlerIds` for the deployable active set.
 */
export type CiCoreFunctionId =
  (typeof CI_AUTH_FUNCS_IDS)[number] | (typeof CI_DATA_FUNCS_IDS)[number];
