import type { ListUsersCommandOutput } from "@aws-sdk/client-cognito-identity-provider";
import type { CiErrorBody, CiResult } from "@cloudigniter/core";

export type CiCognitoListUsersResult = CiResult<
  ListUsersCommandOutput,
  CiErrorBody
>;
