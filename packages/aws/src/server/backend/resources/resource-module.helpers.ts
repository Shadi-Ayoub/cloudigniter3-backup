import type { CiCoreFunctionId } from "../core-types/functions";
import type { CiCoreTableKey } from "../core-types/tables";
import type { CiPolicyFragment } from "../core-types/policy";
import type { CiFunctionEnvMap } from "./env-map";
import type {
  CiBackendModuleStatus,
  CiResourceModule,
  CiResourceModuleContext,
} from "./resource-module.types";
import type { CiCoreResources } from "./resource-types";

/**
 * Define a resource module, correlating active resource IDs with their runtime
 * state while retaining compatibility for dormant legacy module definitions.
 */
export function ciCreateResourceModule<
  const TId extends keyof CiCoreResources & string,
  const TKind extends string,
  const THandlers extends readonly CiCoreFunctionId[],
  TTableKey extends CiCoreTableKey = never,
>(input: {
  id: TId;
  kind: TKind;
  status?: CiBackendModuleStatus;
  handlers: THandlers;
  dependencies?: readonly (keyof CiCoreResources)[];
  envKeyAllowlist: Partial<Record<THandlers[number], readonly string[]>>;
  tableKeys?: readonly TTableKey[];
  resolveEnvValues: (
    input: CiResourceModuleContext<CiCoreResources[TId]>,
  ) => Record<string, string>;
  resolveEnvMap?: (
    input: CiResourceModuleContext<CiCoreResources[TId]>,
  ) => CiFunctionEnvMap;
  resolvePolicies: (
    input: CiResourceModuleContext<CiCoreResources[TId]>,
  ) => CiPolicyFragment;
}): CiResourceModule<TId, TKind, THandlers[number], CiCoreResources[TId]>;
export function ciCreateResourceModule<
  const TId extends string,
  const TKind extends string,
  const THandlers extends readonly CiCoreFunctionId[],
  TState = unknown,
  TTableKey extends CiCoreTableKey = never,
>(input: {
  id: TId;
  kind: TKind;
  status?: CiBackendModuleStatus;
  handlers: THandlers;
  dependencies?: readonly (keyof CiCoreResources)[];
  envKeyAllowlist: Partial<Record<THandlers[number], readonly string[]>>;
  tableKeys?: readonly TTableKey[];
  resolveEnvValues: (
    input: CiResourceModuleContext<TState>,
  ) => Record<string, string>;
  resolveEnvMap?: (input: CiResourceModuleContext<TState>) => CiFunctionEnvMap;
  resolvePolicies: (input: CiResourceModuleContext<TState>) => CiPolicyFragment;
}): CiResourceModule<TId, TKind, THandlers[number], TState>;
export function ciCreateResourceModule(input: {
  id: string;
  kind: string;
  status?: CiBackendModuleStatus;
  handlers: readonly CiCoreFunctionId[];
  dependencies?: readonly (keyof CiCoreResources)[];
  envKeyAllowlist: Partial<Record<CiCoreFunctionId, readonly string[]>>;
  tableKeys?: readonly CiCoreTableKey[];
  resolveEnvValues: (
    input: CiResourceModuleContext<any>,
  ) => Record<string, string>;
  resolveEnvMap?: (input: CiResourceModuleContext<any>) => CiFunctionEnvMap;
  resolvePolicies: (input: CiResourceModuleContext<any>) => CiPolicyFragment;
}): CiResourceModule<string, string, CiCoreFunctionId, any> {
  return {
    ...input,
    status: input.status ?? "active",
  };
}
