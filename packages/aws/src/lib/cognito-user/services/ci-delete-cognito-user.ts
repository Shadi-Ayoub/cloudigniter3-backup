import { ciOk200 } from "@cloudigniter/core/lib";
import type { CiResult } from "@cloudigniter/core/types";
import { ciBuildCognitoError, ciCreateCognitoClient } from "./helpers";
import type { CiDeleteCognitoUserInterface } from "@ci-aws/types";

/**
 * Successful result returned by `deleteCognitoUser`.
 */
export type CiDeleteCognitoUserResult = CiResult<null>;

/**
 * Delete a Cognito user.
 */
export async function ciDeleteCognitoUser(
  input: CiDeleteCognitoUserInterface,
): Promise<CiDeleteCognitoUserResult> {
  try {
    const cognito = await ciCreateCognitoClient(input.CognitoClientConfig);

    const result = await cognito.deleteUser({
      UserPoolId: input.cognito.UserPoolId,
      Username: input.cognito.Username,
    });
    if (!result.ok && result.statusCode !== 404) return result;

    return ciOk200(null);
  } catch (error: unknown) {
    return ciBuildCognitoError(
      "COGNITO_DELETE_USER: Failed to delete the Cognito user.",
      error,
      {
        username: input.cognito.Username,
        userPoolId: input.cognito.UserPoolId,
      },
    );
  }
}
