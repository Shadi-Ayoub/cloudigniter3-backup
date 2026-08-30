import { deepmerge } from "deepmerge-ts";

import type { CiPlanOptions } from "../core-types/plan";
import type { CiCoreFunctionId } from "../core-types/functions";
import type { CiPolicyFragment } from "../core-types/policy";
import { CI_ENV } from "../env/env.keys";
import {
  ciBuildEnvMapFromAllowlist,
  ciMergeEnvMaps,
  type CiFunctionEnvMap,
} from "./env-map";
import { ciMergePolicyFragments } from "./policy-fragment";
import type {
  CiResourceEnvKeyAllowlist,
  CiResourceModule,
  CiResourceModuleContext,
} from "./resource-module.types";
import type { CiCoreResources } from "./resource-types";
import { ciMakeRuntimeCommonPolicies } from "../policy/ci-make-runtime-common-policies";

import {
  ciEmberguardAccessTableResourceModule,
  ciSystemTableResourceModule,
  ciUserProfileTableResourceModule,
} from "./data";
import { ciAuthResourceModule } from "./auth";
import { ciDefineBackendManifest } from "./backend-manifest";

/** Single package-side registration point for active core backend modules. */
export const CI_CORE_BACKEND_MANIFEST = ciDefineBackendManifest({
  modules: [
    ciEmberguardAccessTableResourceModule,
    ciSystemTableResourceModule,
    ciUserProfileTableResourceModule,
    ciAuthResourceModule,
  ] as const,
});

/** @deprecated Prefer `CI_CORE_BACKEND_MANIFEST.modules`. */
export const CI_RESOURCE_MODULES = CI_CORE_BACKEND_MANIFEST.modules;

/** @deprecated Prefer `CI_CORE_BACKEND_MANIFEST.moduleIds`. */
export const CI_RESOURCE_IDS = CI_CORE_BACKEND_MANIFEST.moduleIds;

/** @deprecated Prefer `CI_CORE_BACKEND_MANIFEST.handlerIds`. */
export const CORE_FUNCS_IDS = CI_CORE_BACKEND_MANIFEST.handlerIds;

type CiErasedResourceModule = CiResourceModule<
  keyof CiCoreResources & string,
  string,
  CiCoreFunctionId,
  never
>;

/**
 * Erase a registered module's correlated state only at the heterogeneous
 * execution boundary. Module definitions retain their exact ID/state pairing.
 */
function ciEraseRegisteredModuleState(
  module: (typeof CI_CORE_BACKEND_MANIFEST.modules)[number],
): CiErasedResourceModule {
  return module as unknown as CiErasedResourceModule;
}

const CI_GLOBAL_RESOURCE_ENV_KEYS = [
  CI_ENV.CI_REGION,
  CI_ENV.CI_ENV_MODE,
] as const;

function ciBuildGlobalEnvKeyAllowlist(
  handlers: readonly CiCoreFunctionId[],
): CiResourceEnvKeyAllowlist {
  return handlers.reduce<CiResourceEnvKeyAllowlist>((acc, handler) => {
    acc[handler] = [...CI_GLOBAL_RESOURCE_ENV_KEYS];
    return acc;
  }, {});
}

/**
 * Bind one module to its matching resource state from the full resources object.
 */
function ciBuildModuleContext<
  TId extends keyof CiCoreResources,
  TKind extends string,
  THandler extends CiCoreFunctionId,
  TState extends CiCoreResources[TId],
>(
  module: CiResourceModule<TId, TKind, THandler, TState>,
  input: {
    resources: CiCoreResources;
    region: string;
    envMode: string;
    options: CiPlanOptions;
    extra?: Record<string, unknown>;
  },
): CiResourceModuleContext<TState> {
  return {
    resource: input.resources[module.id] as TState,
    resources: input.resources,
    region: input.region,
    envMode: input.envMode,
    options: input.options,
    extra: input.extra,
  };
}

/**
 * Resolve flat env values for one resource module.
 */
function ciResolveModuleEnvValues<
  TId extends keyof CiCoreResources,
  TKind extends string,
  THandler extends CiCoreFunctionId,
  TState extends CiCoreResources[TId],
>(
  module: CiResourceModule<TId, TKind, THandler, TState>,
  input: {
    resources: CiCoreResources;
    region: string;
    envMode: string;
    options: CiPlanOptions;
    extra?: Record<string, unknown>;
  },
): Record<string, string> {
  return module.resolveEnvValues(ciBuildModuleContext(module, input));
}

/**
 * Resolve optional per-handler env overlays for one resource module.
 */
function ciResolveModuleEnvMap<
  TId extends keyof CiCoreResources,
  TKind extends string,
  THandler extends CiCoreFunctionId,
  TState extends CiCoreResources[TId],
>(
  module: CiResourceModule<TId, TKind, THandler, TState>,
  input: {
    resources: CiCoreResources;
    region: string;
    envMode: string;
    options: CiPlanOptions;
    extra?: Record<string, unknown>;
  },
): CiFunctionEnvMap {
  if (!module.resolveEnvMap) return {};
  return module.resolveEnvMap(ciBuildModuleContext(module, input));
}

/**
 * Resolve policy fragment for one resource module.
 */
function ciResolveModulePolicies<
  TId extends keyof CiCoreResources,
  TKind extends string,
  THandler extends CiCoreFunctionId,
  TState extends CiCoreResources[TId],
>(
  module: CiResourceModule<TId, TKind, THandler, TState>,
  input: {
    resources: CiCoreResources;
    region: string;
    envMode: string;
    options: CiPlanOptions;
    extra?: Record<string, unknown>;
  },
): CiPolicyFragment {
  return module.resolvePolicies({
    resource: input.resources[module.id] as TState,
    resources: input.resources,
    region: input.region,
    envMode: input.envMode,
    options: input.options,
    extra: input.extra,
  });
}

export const resourceEnvKeyAllowlist = [
  ciBuildGlobalEnvKeyAllowlist(CORE_FUNCS_IDS),
  CI_CORE_BACKEND_MANIFEST.envKeyAllowlist,
].reduce<CiResourceEnvKeyAllowlist>(
  (acc, current) => deepmerge(acc, current),
  {},
);

export function ciResolveResourceEnvValues(input: {
  resources: CiCoreResources;
  region: string;
  envMode: string;
  options: CiPlanOptions;
  extra?: Record<string, unknown>;
}): Record<string, string> {
  const globalEnvValues: Record<string, string> = {
    [CI_ENV.CI_REGION]: input.region,
    [CI_ENV.CI_ENV_MODE]: input.envMode,
  };

  const resourceEnvValues: Record<string, string> = {};

  for (const module of CI_CORE_BACKEND_MANIFEST.modules) {
    const resolved = ciResolveModuleEnvValues(
      ciEraseRegisteredModuleState(module),
      input,
    );

    for (const [key, value] of Object.entries(resolved)) {
      const currentValue = resourceEnvValues[key];
      if (currentValue !== undefined && currentValue !== value) {
        throw new Error(
          `Backend modules resolved conflicting values for environment key "${key}".`,
        );
      }
      resourceEnvValues[key] = value;
    }
  }

  return deepmerge(globalEnvValues, resourceEnvValues);
}

export function ciBuildResourceEnvMap(input: {
  resources: CiCoreResources;
  region: string;
  envMode: string;
  options: CiPlanOptions;
  extra?: Record<string, unknown>;
}): CiFunctionEnvMap {
  const flatEnvValues = ciResolveResourceEnvValues(input);

  const allowlistEnvMap = ciBuildEnvMapFromAllowlist(
    resourceEnvKeyAllowlist,
    flatEnvValues,
  );

  const overlayMaps = CI_CORE_BACKEND_MANIFEST.modules.map((module) =>
    ciResolveModuleEnvMap(ciEraseRegisteredModuleState(module), input),
  );

  return ciMergeEnvMaps(allowlistEnvMap, ...overlayMaps);
}

export function ciBuildResourcePolicyFragment(input: {
  resources: CiCoreResources;
  region: string;
  envMode: string;
  options: CiPlanOptions;
  extra?: Record<string, unknown>;
}): CiPolicyFragment {
  return ciMergePolicyFragments([
    ciMakeRuntimeCommonPolicies(),
    ...CI_CORE_BACKEND_MANIFEST.modules.map((module) =>
      ciResolveModulePolicies(ciEraseRegisteredModuleState(module), input),
    ),
  ]);
}
