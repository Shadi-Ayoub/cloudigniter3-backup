import type { UserType as CognitoUserType } from "@aws-sdk/client-cognito-identity-provider";
import { ciOk200, type CiResult } from "@cloudigniter/core";
import { ciBuildCognitoError, ciCreateCognitoClient } from "./helpers";
import type { CiUpdateCognitoUserInterface } from "../";

/**
 * Successful result returned by `updateCognitoUser`.
 */
export type CiUpdateCognitoUserResult = CiResult<CognitoUserType | null>;

/**
 * Update a Cognito user, then re-fetch and return the updated record.
 */
export async function ciUpdateCognitoUser(
  input: CiUpdateCognitoUserInterface,
): Promise<CiUpdateCognitoUserResult> {
  try {
    const cognito = await ciCreateCognitoClient(input.CognitoClientConfig);

    await cognito.updateUser(input.cognito);

    const user = await cognito.getUser({
      UserPoolId: input.cognito.UserPoolId,
      Username: input.cognito.Username,
    });

    return ciOk200((user ?? null) as CognitoUserType | null);
  } catch (error: unknown) {
    return ciBuildCognitoError(
      "COGNITO_UPDATE_USER: Failed to update the Cognito user.",
      error,
      {
        username: input.cognito.Username,
        userPoolId: input.cognito.UserPoolId,
        attributesCount: input.cognito.UserAttributes.length,
      },
    );
  }
}
