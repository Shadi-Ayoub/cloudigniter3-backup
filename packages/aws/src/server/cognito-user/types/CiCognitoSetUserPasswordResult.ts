import type { AdminSetUserPasswordCommandOutput } from "@aws-sdk/client-cognito-identity-provider";
import type { CiErrorBody, CiResult } from "@cloudigniter/core";

export type CiCognitoSetUserPasswordResult = CiResult<
  AdminSetUserPasswordCommandOutput,
  CiErrorBody
>;
