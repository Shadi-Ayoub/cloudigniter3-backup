import type { AdminSetUserPasswordCommandOutput } from "@aws-sdk/client-cognito-identity-provider";
import type { CiErrorBody, CiResult } from "@cloudigniter/core/types";

export type CiCognitoSetUserPasswordResult = CiResult<
  AdminSetUserPasswordCommandOutput,
  CiErrorBody
>;
