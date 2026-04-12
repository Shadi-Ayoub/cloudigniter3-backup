import type { UserType as CognitoUserType } from "@aws-sdk/client-cognito-identity-provider";
import { ciOk200, type CiResult } from "@cloudigniter/core";
import { ciBuildCognitoError, ciCreateCognitoClient } from "./helpers";
import type { CiGetCognitoUserInterface } from "../";

/**
 * Successful result returned by `getCognitoUser`.
 */
export type CiGetCognitoUserResult = CiResult<CognitoUserType>;

/**
 * Get a Cognito user.
 */
export async function ciGetCognitoUser(
  input: CiGetCognitoUserInterface,
): Promise<CiGetCognitoUserResult> {
  try {
    const cognito = await ciCreateCognitoClient(input.CognitoClientConfig);

    const user = await cognito.getUser({
      UserPoolId: input.cognito.UserPoolId,
      Username: input.cognito.Username,
    });

    return ciOk200(user as CognitoUserType);
  } catch (error: unknown) {
    return ciBuildCognitoError(
      "COGNITO_GET_USER: Failed to get the Cognito user.",
      error,
      {
        username: input.cognito.Username,
        userPoolId: input.cognito.UserPoolId,
      },
    );
  }
}
