import type { CiResult } from "@cloudigniter/core/types";
import {
  ciBuildCognitoError,
  ciCreateCognitoClient,
  ciMapCognitoUser,
} from "@ci-aws/lib";
import type { CICognitoUser, CiGetCognitoUserInterface } from "@ci-aws/types";

/**
 * Successful result returned by `getCognitoUser`.
 */
export type CiGetCognitoUserResult = CiResult<CICognitoUser>;

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

    if (!user.ok) return user;
    return {
      ...user,
      body: ciMapCognitoUser(user.body),
    };
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
