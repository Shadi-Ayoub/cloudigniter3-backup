import { ciPrepareEnvironmentVars } from './env/env.build';
import { ciPreparePolicy } from './policy';
import { ciGetEnabledCoreHandlerIds } from './registry/ci-core-handler-registry';

import type { ApplyArgs, CiCoreRuntime, CiPlanOptions, PostBuildPlan } from './types';
import type { CiCoreAuth } from './core-types/auth';

import type { CiEnvMap } from './core-types/env';
import type { CiCoreFunctionId } from './core-types/functions';
import type { CiTableGrantAction } from './core-types/tables';
import type { CiPolicyStatementInput } from './core-types/policy';

export { CORE_FUNCS_IDS, resourceEnvKeyAllowlist } from './resources';

const DEFAULT_OPTS: Required<Omit<CiPlanOptions, 'authParams'>> = {
  includeAuthEnv: false,
  includeDefaultDynamoPolicies: true,
};

function ciStmtTouchesServices(statement: CiPolicyStatementInput, services: string[]): boolean {
  const actions: string[] = statement.actions;
  const resources: string[] = statement.resources;

  const touches = (service: string) =>
    actions.some((action) => action.startsWith(`${service}:`)) ||
    resources.some((resource) => resource.includes(`:${service}:`));

  return services.some(touches);
}

export function ciCreateCorePostBuildPlan(
  rt: CiCoreRuntime,
  opts?: CiPlanOptions,
  extra?: { auth?: CiCoreAuth }
): PostBuildPlan {
  const options = { ...DEFAULT_OPTS, ...opts };

  const env: CiEnvMap = ciPrepareEnvironmentVars(rt, options, extra);
  const { inlinePolicies, commonStatements, tableGrants } = ciPreparePolicy(
    rt.resources,
    options,
    rt.region,
    rt.envMode,
    extra
  );

  return {
    env,
    inlinePolicies,
    commonStatements,
    tableGrants,
  };
}

export function ciApplyCorePostBuildPlan(plan: PostBuildPlan, args: ApplyArgs) {
  const iam = args.iamModule;

  const include = new Set<CiCoreFunctionId>(args.includeFunctions ?? ciGetEnabledCoreHandlerIds());

  for (const [fnIdRaw, kv] of Object.entries(plan.env)) {
    const fnId = fnIdRaw as CiCoreFunctionId;
    if (!include.has(fnId)) continue;

    const fn = args.functions[fnId];
    if (!fn || !kv || typeof fn.addEnvironment !== 'function') continue;

    const allow = args.envKeyAllowlist?.[fnId];
    const entries = allow ? Object.entries(kv).filter(([key]) => allow.includes(key)) : Object.entries(kv);

    for (const [key, value] of entries) {
      fn.addEnvironment(key, value);
    }
  }

  for (const policySpec of plan.inlinePolicies ?? []) {
    if (!include.has(policySpec.for)) continue;

    const fn = args.functions[policySpec.for];
    if (!fn?.role) continue;

    const keptStatements = args.stripServices?.length
      ? policySpec.statements.filter((statement) => !ciStmtTouchesServices(statement, args.stripServices!))
      : policySpec.statements;

    if (keptStatements.length === 0) continue;

    const policy = new iam.Policy(fn, policySpec.id ?? `InlinePolicy-${policySpec.for}`, {
      statements: keptStatements.map(
        (statement: CiPolicyStatementInput) =>
          new iam.PolicyStatement({
            effect: statement.effect === 'Allow' ? iam.Effect.ALLOW : iam.Effect.DENY,
            actions: statement.actions,
            resources: statement.resources,
          })
      ),
    });

    fn.role.attachInlinePolicy(policy);
  }

  for (const fnId of include) {
    const fn = args.functions[fnId];
    if (!fn?.role) continue;

    for (const statement of plan.commonStatements ?? []) {
      const stmt = new iam.PolicyStatement({
        effect: statement.effect === 'Allow' ? iam.Effect.ALLOW : iam.Effect.DENY,
        actions: statement.actions,
        resources: statement.resources,
      });

      if (typeof fn.addToRolePolicy === 'function') {
        fn.addToRolePolicy(stmt);
        continue;
      }

      fn.role.attachInlinePolicy(
        new iam.Policy(fn as object, `Common-${fnId}-${statement.effect}`, {
          statements: [stmt],
        })
      );
    }
  }

  if (args.applyTableGrants && args.tableArns) {
    for (const grant of plan.tableGrants ?? []) {
      if (!include.has(grant.for)) continue;

      const fn = args.functions[grant.for];
      if (!fn?.role) continue;

      if (args.stripServices?.includes('dynamodb')) continue;

      const tableArn = args.tableArns[grant.table];
      if (!tableArn) continue;

      const ddbActions = Array.from(
        new Set(
          grant.actions.flatMap((action: CiTableGrantAction) => {
            switch (action) {
              case 'Write':
                return [
                  'dynamodb:PutItem',
                  'dynamodb:UpdateItem',
                  'dynamodb:DeleteItem',
                  'dynamodb:BatchWriteItem',
                  'dynamodb:TransactWriteItems',
                ];
              case 'Read':
                return ['dynamodb:GetItem', 'dynamodb:Query', 'dynamodb:Scan'];
              default:
                return [`dynamodb:${action}`];
            }
          })
        )
      );

      const policy = new iam.Policy(fn, `GrantShim-${grant.for}-${String(grant.table)}`, {
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ddbActions,
            resources: [tableArn, `${tableArn}/index/*`],
          }),
        ],
      });

      fn.role.attachInlinePolicy(policy);
    }
  }
}
