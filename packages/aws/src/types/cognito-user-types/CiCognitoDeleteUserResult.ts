import type { AdminDeleteUserCommandOutput } from "@aws-sdk/client-cognito-identity-provider";
import type { CiErrorBody, CiResult } from "@cloudigniter/core/types";

export type CiCognitoDeleteUserResult = CiResult<
  AdminDeleteUserCommandOutput,
  CiErrorBody
>;
