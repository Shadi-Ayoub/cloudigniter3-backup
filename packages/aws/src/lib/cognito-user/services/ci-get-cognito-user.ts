import type { CiResult } from "@cloudigniter/core/types";
import {
  ciBuildCognitoError,
  ciCreateCognitoClient,
  ciMapCognitoUser,
} from "@ci-aws/lib";
import type { CICognitoUser, CiGetCognitoUserInterface } from "@ci-aws/types";
import { ciListCognitoUserGroups } from "./helpers";

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
    const userPoolId = input.cognito.UserPoolId;
    const username = input.cognito.Username;
    if (!userPoolId || !username) {
      throw new Error(
        "COGNITO_GET_USER: UserPoolId and Username are required.",
      );
    }
    const cognito = await ciCreateCognitoClient(input.CognitoClientConfig);

    const user = await cognito.getUser({
      UserPoolId: userPoolId,
      Username: username,
    });

    if (!user.ok) return user;
    const client = await cognito.getIdentityProviderClient();
    const groups = await ciListCognitoUserGroups(client, {
      userPoolId,
      username,
    });
    return {
      ...user,
      body: ciMapCognitoUser(user.body, groups),
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
