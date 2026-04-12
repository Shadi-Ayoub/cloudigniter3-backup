import type { CiCoreAuth, CiCoreAuthParams } from './core-types/auth';
import type { CiCoreRuntime } from './core-types/runtime';
import type { CiEnvMap } from './core-types/env';
import type { CiPlanOptions } from './core-types/plan';

import type { CiInlinePolicySpec, CiPolicyFragment } from './core-types/policy';

import type { CiPolicyStatementInput, CiPolicyStatementSpec } from './core-types/policy';

import type {
  CiCoreResources,
  CiTableResourceState,
  CiBucketResourceState,
  CiUserPoolResourceState,
  CiApiResourceState,
} from './resources/resource-types';

import type { CiResourceModule, CiResourceEnvKeyAllowlist } from './resources/resource-module.types';

import type { CiFunctionEnvMap } from './resources/env-map';

import type { CiCoreFunctionId } from './core-types/functions';

import type { CiCoreTableKey, CiTableGrantAction, CiTableGrantSpec } from './core-types/tables';

export type {
  CiCoreAuth,
  CiCoreAuthParams,
  CiCoreRuntime,
  CiEnvMap,
  CiPlanOptions,
  CiCoreResources,
  CiTableResourceState,
  CiBucketResourceState,
  CiUserPoolResourceState,
  CiApiResourceState,
  CiResourceModule,
  CiResourceEnvKeyAllowlist,
  CiFunctionEnvMap,
  CiPolicyStatementInput,
  CiPolicyStatementSpec,
  CiInlinePolicySpec,
  CiPolicyFragment,
  CiCoreFunctionId,
  CiCoreTableKey,
  CiTableGrantAction,
  CiTableGrantSpec,
};

export type CiPolicyBundle = {
  inlinePolicies: CiInlinePolicySpec[];
  commonStatements: CiPolicyStatementInput[];
  tableGrants: CiTableGrantSpec[];
};

export type BivariantFn<Args extends unknown[], R> = {
  bivarianceHack(...args: Args): R;
}['bivarianceHack'];

export type MinimalIamRole = {
  attachInlinePolicy: BivariantFn<[policy: unknown], void>;
};

export type MinimalFunctionConstruct = {
  addEnvironment?: (key: string, value: string) => void;
  addToRolePolicy?: BivariantFn<[statement: unknown], void>;
  role?: MinimalIamRole;
};

export type TableArnMap = Partial<Record<CiCoreTableKey, string>>;

export type ApplyArgs = {
  functions: Partial<Record<CiCoreFunctionId, MinimalFunctionConstruct>>;
  iamModule: {
    Policy: new (...args: any[]) => any;
    PolicyStatement: new (...args: any[]) => any;
    Effect: { ALLOW: any; DENY: any };
  };
  applyTableGrants?: boolean;
  tableArns?: TableArnMap;
  includeFunctions?: CiCoreFunctionId[];
  envKeyAllowlist?: Partial<Record<CiCoreFunctionId, readonly string[]>>;
  stripServices?: string[];
};

export type PostBuildPlan = {
  env: CiEnvMap;
  inlinePolicies: CiInlinePolicySpec[];
  commonStatements: CiPolicyStatementInput[];
  tableGrants: CiTableGrantSpec[];
};
