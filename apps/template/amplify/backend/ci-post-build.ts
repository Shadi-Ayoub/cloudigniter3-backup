import * as iam from "aws-cdk-lib/aws-iam";

import {
  ciApplyCorePostBuildPlan,
  ciCreateAmplifyCoreRuntime,
  ciCreateCorePostBuildPlan,
} from "@cloudigniter/aws/server/backend";

import { ciGetAuthStack } from "./auth";
import { ciGetDataStack } from "./data";
import type { CiBackend } from "./types";

export function ciPostBuild(backend: CiBackend) {
  const data = ciGetDataStack(backend);
  const auth = ciGetAuthStack(backend);
  const runtime = ciCreateAmplifyCoreRuntime({
    region: backend.stack.region,
    envMode: process.env.CI_ENV_MODE,
    tables: data.tables,
  });

  const plan = ciCreateCorePostBuildPlan(
    runtime,
    {
      includeAuthEnv: false,
      authParams: auth.authParams,
    },
    {
      auth: {
        userPoolId: auth.userPool.userPoolId,
        userPoolArn: auth.userPool.userPoolArn,
      },
    },
  );

  ciApplyCorePostBuildPlan(plan, {
    iamModule: iam,
    functions: {
      ...auth.functions,
      ...data.functions,
    },
    includeFunctions: [...auth.CI_AUTH_FUNCS_IDS, ...data.CI_DATA_FUNCS_IDS],
    envKeyAllowlist: {
      ...auth.envKeyAllowlist,
      ...data.envKeyAllowlist,
    },
    applyTableGrants: true,
    tableArns: data.tableArns,
    strict: true,
  });

  // Publish manifest-declared backend outputs to amplify_outputs.json.
  backend.addOutput({
    custom: {
      cloudigniter: {
        ...data.outputs,
      },
    },
  });
}
