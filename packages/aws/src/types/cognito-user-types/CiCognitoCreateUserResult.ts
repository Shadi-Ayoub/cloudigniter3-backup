import type { AdminCreateUserCommandOutput } from "@aws-sdk/client-cognito-identity-provider";
import type { CiErrorBody, CiResult } from "@cloudigniter/core/types";

export type CiCognitoCreateUserResult = CiResult<
  AdminCreateUserCommandOutput,
  CiErrorBody
>;
