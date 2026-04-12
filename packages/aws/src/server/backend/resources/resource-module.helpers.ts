import type { CiCoreFunctionId } from '../core-types/functions';
import type { CiCoreTableKey } from '../core-types/tables';
import type { CiPolicyFragment } from '../core-types/policy';
import type { CiFunctionEnvMap } from './env-map';
import type { CiResourceModule, CiResourceModuleContext } from './resource-module.types';

export function ciCreateResourceModule<
  const TId extends string,
  const TKind extends string,
  const THandlers extends readonly CiCoreFunctionId[],
  TState = unknown,
  TTableKey extends CiCoreTableKey = never,
>(input: {
  id: TId;
  kind: TKind;
  handlers: THandlers;
  envKeyAllowlist: Partial<Record<THandlers[number], readonly string[]>>;
  tableKeys?: readonly TTableKey[];
  resolveEnvValues: (input: CiResourceModuleContext<TState>) => Record<string, string>;
  resolveEnvMap?: (input: CiResourceModuleContext<TState>) => CiFunctionEnvMap;
  resolvePolicies: (input: CiResourceModuleContext<TState>) => CiPolicyFragment;
}): CiResourceModule<TId, TKind, THandlers[number], TState> {
  return input;
}
