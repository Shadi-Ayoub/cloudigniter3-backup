// ─────────────────────────────────────────────────────────────
// auth
// ─────────────────────────────────────────────────────────────
export { ciAuthResourceModule } from "./resources/auth";

// ─────────────────────────────────────────────────────────────
// data resources
// ─────────────────────────────────────────────────────────────
export { CI_DATA_RESOURCE_MODULES } from "./resources";

// ─────────────────────────────────────────────────────────────
// env
// ─────────────────────────────────────────────────────────────
export {
  CI_ENV,
  ciPrepareEnvironmentVars,
  ciMergeEnvMaps,
  type CiEnvKey,
  type CiEnvAllowList,
} from "./env";

// ─────────────────────────────────────────────────────────────
// handlers
// ─────────────────────────────────────────────────────────────
export {
  // system
  ciGetLambdaParametersHandler,

  // cognito
  ciCreateCognitoUserHandler,
  ciDeleteCognitoUserHandler,
  ciGetCognitoUserHandler,
  ciSetCognitoUserPasswordHandler,
  ciUpdateCognitoUserHandler,
} from "./handlers";

// ─────────────────────────────────────────────────────────────
// core build helpers
// ─────────────────────────────────────────────────────────────
export {
  ciApplyCorePostBuildPlan,
  ciCreateCorePostBuildPlan,
} from "./post-build";

// ─────────────────────────────────────────────────────────────
// root user
// ─────────────────────────────────────────────────────────────
export {
  ciBootstrapRootUser,
  ciBootstrapRootUserFromAmplifyApp,
  type CiBootstrapRootUserInput,
  type CiBootstrapRootUserResult,
  type CiBootstrapRootUserFromAmplifyAppInput,
  type CiRootUserConfig,
  type CiRootUserPasswordPolicy,
} from "./root-user";

// export { ciCreateOrgUnitHandler } from "./handlers/ou-handlers/create-ou-handler";
// export { ciCreateTenantHandler } from "./handlers/tenant-handlers/create-tenant-handler";
// export { ciClearSeederHandler } from "./handlers/seeder-handlers/clear-seeder-handler";
// export { ciDeleteOrgUnitHandler } from "./handlers/ou-handlers/delete-ou-handler";
// export { ciDeleteTenantHandler } from "./handlers/tenant-handlers/delete-tenant-handler";
// export { ciGetLambdaParametersHandler } from "./handlers/system-handlers/get-lambda-parameters-handler";
// export { ciGetOrgUnitHandler } from "./handlers/ou-handlers/get-ou-handler";
// export { ciGetOrgUnitTreeHandler } from "./handlers/ou-handlers/get-ou-tree-handler";
// export { ciGetSettingsHandler } from "./handlers/settings-handlers/ci-get-settings-handler";
// export { ciGetTenantBySlugHandler } from "./handlers/tenant-handlers/get-tenant-by-slug-handler";
// export { ciGetTenantHandler } from "./handlers/tenant-handlers/get-tenant-handler";
// export { ciGetTenantLookupBySlugHandler } from "./handlers/tenant-handlers/get-tenant-lookup-by-slug-handler";
// export { ciListOrgUnitsHandler } from "./handlers/ou-handlers/list-ous-handler";
// export { ciListTenantsHandler } from "./handlers/tenant-handlers/list-tenants-handler";
// export { ciSeedTenantsHandler } from "./handlers/tenant-handlers/seed-tenants-handler";
// export { ciUpdateOrgUnitHandler } from "./handlers/ou-handlers/update-ou-handler";
// export { ciUpdateTenantHandler } from "./handlers/tenant-handlers/update-tenant-handler";

// ─────────────────────────────────────────────────────────────
// core types
// ─────────────────────────────────────────────────────────────
export type {
  CiCoreAuth,
  CiCoreAuthParams,
  CiCoreRuntime,
  CiEnvMap,
  CiInlinePolicySpec,
  CiPlanOptions,
  CiPolicyFragment,
  CiPolicyStatementInput,
  CiPolicyStatementSpec,
  CiCoreFunctionId,
  CiCoreTableKey,
  CiTableGrantAction,
  CiTableGrantSpec,
  CiCoreTables,
} from "./core-types";

// ─────────────────────────────────────────────────────────────
// resources types
// ─────────────────────────────────────────────────────────────
export type {
  CiCoreResources,
  CiTableResourceState,
  CiBucketResourceState,
  CiUserPoolResourceState,
  CiApiResourceState,
  CiResourceModule,
  CiResourceEnvKeyAllowlist,
  CiFunctionEnvMap,
} from "./resources";
