import type {
  AdminCreateUserCommandOutput,
  UserType as CognitoUserType,
} from "@aws-sdk/client-cognito-identity-provider";
import { ciError400, ciOk200 } from "@cloudigniter/core";
import type { CiResult } from "@cloudigniter/core/types";
import {
  ciBuildCognitoError,
  ciCreateCognitoClient,
  ciIsCognitoUserNotFoundError,
} from "../services/helpers";
import { type CiCreateCognitoUserInterface } from "../types";

/**
 * Successful result returned by `ciCreateCognitoUser`.
 */
export type CiCreateCognitoUserResult = CiResult<CognitoUserType>;

/**
 * Create a Cognito user if the user does not already exist.
 */
export async function ciCreateCognitoUser(
  input: CiCreateCognitoUserInterface,
): Promise<CiCreateCognitoUserResult> {
  let cognito: Awaited<ReturnType<typeof ciCreateCognitoClient>>;

  try {
    cognito = await ciCreateCognitoClient(input.CognitoClientConfig);
  } catch (error: unknown) {
    return ciBuildCognitoError(
      "COGNITO_CREATE_USER: Failed to initialize Cognito client.",
      error,
      {
        username: input.cognito.Username,
        userPoolId: input.cognito.UserPoolId,
      },
    );
  }

  try {
    const existingUser = await cognito.getUser({
      UserPoolId: input.cognito.UserPoolId,
      Username: input.cognito.Username,
    });

    return ciError400(
      `COGNITO_CREATE_USER: The user "${input.cognito.Username}" already exists.`,
      {
        username: input.cognito.Username,
        userPoolId: input.cognito.UserPoolId,
        existingUser,
      },
    );
  } catch (error: unknown) {
    if (!ciIsCognitoUserNotFoundError(error)) {
      return ciBuildCognitoError(
        "COGNITO_CREATE_USER: Failed while checking whether the user already exists.",
        error,
        {
          username: input.cognito.Username,
          userPoolId: input.cognito.UserPoolId,
        },
      );
    }
  }

  try {
    const createResult = await cognito.createUser(input.cognito);

    if (!createResult.ok) {
      return createResult;
    }

    const createOutput = createResult.body as AdminCreateUserCommandOutput;
    const user = createOutput.User;

    if (!user) {
      return ciError400(
        "COGNITO_CREATE_USER: Cognito did not return a User object after the create operation.",
        {
          username: input.cognito.Username,
          userPoolId: input.cognito.UserPoolId,
          createOutput,
        },
      );
    }

    if (input.setPassword) {
      const password = input.password ?? cognito.generatePassword();

      await cognito.setUserPassword({
        UserPoolId: input.cognito.UserPoolId,
        Username: user.Username,
        Password: password,
        Permanent: input.permanent ?? false,
      });
    }

    return ciOk200(user);
  } catch (error: unknown) {
    return ciBuildCognitoError(
      "COGNITO_CREATE_USER: Failed to create the Cognito user.",
      error,
      {
        username: input.cognito.Username,
        userPoolId: input.cognito.UserPoolId,
      },
    );
  }
}
