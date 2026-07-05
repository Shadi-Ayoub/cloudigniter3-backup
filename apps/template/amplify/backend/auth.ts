import { type IUserPool } from "aws-cdk-lib/aws-cognito";
import { ArnFormat, Stack } from "aws-cdk-lib";

import {
  type CiCoreAuth,
  type CiCoreFunctionId,
  ciAuthResourceModule,
} from "@cloudigniter/aws/server/backend";

import { ciPickEnvKeyAllowlistForFunctions } from "./ci-pick-env-key-allowlist-for-functions";
import type { CiBackend } from "./types";

export const ciGetAuthStack = (backend: CiBackend) => {
  const userPool = ciPrepareUserPool(backend.auth.resources.userPool);

  const authParams = {
    userPoolIdParam: "/cloudigniter/auth/userPoolId",
    userPoolArnParam: "/cloudigniter/auth/userPoolArn",
  };

  const functions = {
    ciCreateCognitoUserHandler:
      backend.createCognitoUserHandler.resources.lambda,
    ciGetCognitoUserHandler: backend.getCognitoUserHandler.resources.lambda,
  };

  const CI_AUTH_FUNCS_IDS = ciAuthResourceModule.handlers.filter(
    (fnId): fnId is keyof typeof functions & CiCoreFunctionId =>
      fnId in functions,
  );

  const envKeyAllowlist = ciPickEnvKeyAllowlistForFunctions(
    ciAuthResourceModule.envKeyAllowlist,
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
