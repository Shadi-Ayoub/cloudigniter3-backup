import * as iam from "aws-cdk-lib/aws-iam";

import {
  ciApplyCorePostBuildPlan,
  ciCreateCorePostBuildPlan,
} from "@cloudigniter/aws/server/backend";

import { ciGetAuthStack } from "./auth";
import { ciGetDataStack } from "./data";
import { ciGetRuntimeStack } from "./runtime";
import type { CiBackend } from "./types";

export function ciPostBuild(backend: CiBackend) {
  const data = ciGetDataStack(backend);
  const auth = ciGetAuthStack(backend);
  const runtime = ciGetRuntimeStack(backend, { auth, data });

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
    functions: auth.functions,
    includeFunctions: [...auth.CI_AUTH_FUNCS_IDS],
    envKeyAllowlist: auth.envKeyAllowlist,
    stripServices: ["dynamodb"],
  });

  ciApplyCorePostBuildPlan(plan, {
    iamModule: iam,
    functions: data.functions,
    includeFunctions: [...data.CI_DATA_FUNCS_IDS],
    envKeyAllowlist: data.envKeyAllowlist,
    applyTableGrants: true,
    tableArns: data.tableArns,
  });

  // This makes the physical table name available in amplify_outputs.json.
  backend.addOutput({
    custom: {
      cloudigniter: {
        userProfileTableName: data.tables.userProfileTable.name,
      },
    },
  });
}
