import type { AdminGetUserCommandOutput } from "@aws-sdk/client-cognito-identity-provider";
import type { CiErrorBody, CiResult } from "@cloudigniter/core";

export type CiCognitoGetUserResult = CiResult<
  AdminGetUserCommandOutput,
  CiErrorBody
>;
