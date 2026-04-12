import { deepmerge } from 'deepmerge-ts';

import type { CiPlanOptions } from '../core-types/plan';
import type { CiCoreFunctionId } from '../core-types/functions';
import type { CiPolicyFragment } from '../core-types/policy';
import { CI_ENV } from '../env/env.keys';
import { ciBuildEnvMapFromAllowlist, ciMergeEnvMaps, type CiFunctionEnvMap } from './env-map';
import { ciMergePolicyFragments } from './policy-fragment';
import type { CiResourceEnvKeyAllowlist, CiResourceModule, CiResourceModuleContext } from './resource-module.types';
import type { CiCoreResources } from './resource-types';
import { ciMakeRuntimeCommonPolicies } from '../policy/ci-make-runtime-common-policies';

import { CI_DATA_RESOURCE_MODULES } from './data';
import { ciAuthResourceModule } from './auth';

export const CI_RESOURCE_MODULES = [...CI_DATA_RESOURCE_MODULES, ciAuthResourceModule] as const;

export const CI_RESOURCE_IDS = CI_RESOURCE_MODULES.map((module) => module.id) as readonly string[];

export const CORE_FUNCS_IDS = Array.from(
  new Set(CI_RESOURCE_MODULES.flatMap((module) => module.handlers))
) as readonly CiCoreFunctionId[];

const CI_GLOBAL_RESOURCE_ENV_KEYS = [CI_ENV.CI_REGION, CI_ENV.CI_ENV_MODE] as const;

function ciBuildGlobalEnvKeyAllowlist(handlers: readonly CiCoreFunctionId[]): CiResourceEnvKeyAllowlist {
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
  }
): CiResourceModuleContext<TState> {
  return {
    resource: input.resources[module.id] as TState,
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
  }
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
  }
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
  }
): CiPolicyFragment {
  return module.resolvePolicies({
    resource: input.resources[module.id] as TState,
    region: input.region,
    envMode: input.envMode,
    options: input.options,
    extra: input.extra,
  });
}

export const resourceEnvKeyAllowlist = [
  ciBuildGlobalEnvKeyAllowlist(CORE_FUNCS_IDS),
  ...CI_RESOURCE_MODULES.map((module) => module.envKeyAllowlist),
].reduce<CiResourceEnvKeyAllowlist>((acc, current) => deepmerge(acc, current), {});

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

  const resourceEnvValues = CI_RESOURCE_MODULES.map((module) => ciResolveModuleEnvValues(module, input)).reduce<
    Record<string, string>
  >((acc, current) => deepmerge(acc, current), {});

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

  const allowlistEnvMap = ciBuildEnvMapFromAllowlist(resourceEnvKeyAllowlist, flatEnvValues);

  const overlayMaps = CI_RESOURCE_MODULES.map((module) => ciResolveModuleEnvMap(module, input));

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
    ...CI_RESOURCE_MODULES.map((module) => ciResolveModulePolicies(module, input)),
  ]);
}
