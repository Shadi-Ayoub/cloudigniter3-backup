// ─────────────────────────────────────────────────────────────
// table modules
// ─────────────────────────────────────────────────────────────
export {
  CI_DATA_RESOURCE_MODULES,
  ciPrivateSettingsTableResourceModule,
  ciPublicSettingsTableResourceModule,
  ciSystemTableResourceModule,
  ciUserProfileTableResourceModule,
  ciUserSettingsTableResourceModule,
} from "./data";

// ─────────────────────────────────────────────────────────────
// Combined Export (for registry consumption)
// ─────────────────────────────────────────────────────────────
export {
  CI_RESOURCE_MODULES,
  CI_RESOURCE_IDS,
  CORE_FUNCS_IDS,
  resourceEnvKeyAllowlist,
  ciResolveResourceEnvValues,
  ciBuildResourceEnvMap,
  ciBuildResourcePolicyFragment,
} from "./resource-registry";

export { ciCreateResourceModule } from "./resource-module.helpers";
export { ciBuildEnvMapFromAllowlist, type CiFunctionEnvMap } from "./env-map";
export { ciMergePolicyFragments } from "./policy-fragment";

export type {
  CiResourceModule,
  CiResourceEnvKeyAllowlist,
} from "./resource-module.types";

export type {
  CiCoreResources,
  CiTableResourceState,
  CiBucketResourceState,
  CiUserPoolResourceState,
  CiApiResourceState,
} from "./resource-types";
