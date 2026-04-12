import type { CiPlanOptions } from '../core-types/plan';
import type { CiCoreFunctionId } from '../core-types/functions';
import type { CiCoreTableKey } from '../core-types/tables';
import type { CiPolicyFragment } from '../core-types/policy';
import type { CiFunctionEnvMap } from './env-map';

export type CiResourceModuleContext<TState = unknown> = {
  resource: TState;
  region: string;
  envMode: string;
  options: CiPlanOptions;
  extra?: Record<string, unknown>;
};

export type CiResourceEnvKeyAllowlist = Partial<Record<CiCoreFunctionId, readonly string[]>>;

export type CiResourceEnvKeyAllowlistFor<THandlers extends readonly CiCoreFunctionId[]> = Partial<
  Record<THandlers[number], readonly string[]>
>;

export type CiResourceModule<TId extends string, TKind extends string, THandlerId extends CiCoreFunctionId, TState> = {
  id: TId;
  kind: TKind;
  handlers: readonly THandlerId[];
  envKeyAllowlist: Partial<Record<THandlerId, readonly string[]>>;
  tableKeys?: readonly CiCoreTableKey[];
  resolveEnvValues: (input: CiResourceModuleContext<TState>) => Record<string, string>;
  resolveEnvMap?: (input: CiResourceModuleContext<TState>) => CiFunctionEnvMap;
  resolvePolicies: (input: CiResourceModuleContext<TState>) => CiPolicyFragment;
};
