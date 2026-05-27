import { ciOk200 } from "@cloudigniter/core/lib";
import type { CiResult } from "@cloudigniter/core/types";
import { ciBuildCognitoError, ciCreateCognitoClient } from "@ci-aws/lib";
import type { CiSetCognitoUserPasswordInterface } from "@ci-aws/types";

/**
 * Successful result returned by `setCognitoUserPassword`.
 */
export type CiSetCognitoUserPasswordResult = CiResult<null>;

/**
 * Set a Cognito user's password.
 */
export async function ciSetCognitoUserPassword(
  input: CiSetCognitoUserPasswordInterface,
): Promise<CiSetCognitoUserPasswordResult> {
  try {
    const cognito = await ciCreateCognitoClient(
      input.options?.CognitoClientConfig,
    );

    await cognito.setUserPassword(input.command);

    return ciOk200(null);
  } catch (error: unknown) {
    return ciBuildCognitoError(
      "COGNITO_SET_USER_PASSWORD: Failed to set the Cognito user password.",
      error,
      {
        username: input.command.Username,
        userPoolId: input.command.UserPoolId,
        permanent: input.command.Permanent,
      },
    );
  }
}
