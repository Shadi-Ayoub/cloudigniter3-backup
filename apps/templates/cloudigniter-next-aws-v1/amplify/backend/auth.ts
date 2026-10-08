import { type IUserPool } from "aws-cdk-lib/aws-cognito";
import { ArnFormat, Stack } from "aws-cdk-lib";

import {
  type CiCoreAuth,
  type CiCoreFunctionId,
  ciPickEnvKeyAllowlistForFunctions,
  ciResolveAmplifyFunctionLambdas,
  resourceEnvKeyAllowlist,
} from "@cloudigniter/aws/server/backend";
import { CI_CORE_AMPLIFY_AUTH_FUNCTION_BINDINGS } from "./ci-core-amplify-manifest";
import type { CiBackend } from "./types";

export const ciGetAuthStack = (backend: CiBackend) => {
  const userPool = ciPrepareUserPool(backend.auth.resources.userPool);

  const authParams = {
    userPoolIdParam: "/cloudigniter/auth/userPoolId",
    userPoolArnParam: "/cloudigniter/auth/userPoolArn",
  };

  const functions = ciResolveAmplifyFunctionLambdas(
    backend,
    CI_CORE_AMPLIFY_AUTH_FUNCTION_BINDINGS,
  );

  const CI_AUTH_FUNCS_IDS = Object.keys(
    CI_CORE_AMPLIFY_AUTH_FUNCTION_BINDINGS,
  ) as (keyof typeof functions & CiCoreFunctionId)[];

  const envKeyAllowlist = ciPickEnvKeyAllowlistForFunctions(
    resourceEnvKeyAllowlist,
    functions,
  );

  return {
    userPool,
    authParams,
    functions,
    CI_AUTH_FUNCS_IDS,
    envKeyAllowlist,
  };
};

export function ciPrepareUserPool(up: IUserPool) {
  const userPoolId = up.userPoolId;
  const authStack = Stack.of(up);

  const userPoolArn = authStack.formatArn({
    service: "cognito-idp",
    resource: "userpool",
    resourceName: userPoolId,
    arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
  });

  const userPool: CiCoreAuth = { userPoolId, userPoolArn };

  return userPool;
}
