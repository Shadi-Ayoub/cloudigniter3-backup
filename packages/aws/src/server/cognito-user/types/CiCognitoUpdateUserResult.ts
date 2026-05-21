import type { AdminUpdateUserAttributesCommandOutput } from "@aws-sdk/client-cognito-identity-provider";
import type { CiErrorBody, CiResult } from "@cloudigniter/core/types";

export type CiCognitoUpdateUserResult = CiResult<
  AdminUpdateUserAttributesCommandOutput,
  CiErrorBody
>;
