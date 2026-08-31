import {
  AdminAddUserToGroupCommand,
  type AdminCreateUserCommandOutput,
  type UserType as CognitoUserType,
} from "@aws-sdk/client-cognito-identity-provider";
import { ciError400, ciOk200 } from "@cloudigniter/core/lib";
import type { CiResult } from "@cloudigniter/core/types";
import {
  ciBuildCognitoError,
  ciCreateCognitoClient,
  ciMapCognitoUser,
} from "@ci-aws/lib";
import type {
  CICognitoUser,
  CiCreateCognitoUserInterface,
} from "@ci-aws/types";

/**
 * Successful result returned by `ciCreateCognitoUser`.
 */
export type CiCreateCognitoUserResult = CiResult<CICognitoUser>;

/**
 * Create a Cognito user if the user does not already exist.
 */
export async function ciCreateCognitoUser(
  input: CiCreateCognitoUserInterface,
): Promise<CiCreateCognitoUserResult> {
  let cognito: Awaited<ReturnType<typeof ciCreateCognitoClient>>;
  let createdUsername: string | undefined;

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

  const rollbackCreatedUser = async (): Promise<void> => {
    if (!createdUsername) return;
    const rollback = await cognito.deleteUser({
      UserPoolId: input.cognito.UserPoolId,
      Username: createdUsername,
    });
    if (!rollback.ok && rollback.statusCode !== 404) {
      throw new Error(
        `Cognito rollback failed with status ${rollback.statusCode}.`,
      );
    }
  };

  try {
    const existingUser = await cognito.getUser({
      UserPoolId: input.cognito.UserPoolId,
      Username: input.cognito.Username,
    });
    if (existingUser.ok) {
      return ciError400<CICognitoUser>(
        `COGNITO_CREATE_USER: The user "${input.cognito.Username}" already exists.`,
        {
          username: input.cognito.Username,
          userPoolId: input.cognito.UserPoolId,
        },
      );
    }
    if (existingUser.statusCode !== 404) return existingUser;
  } catch (error: unknown) {
    return ciBuildCognitoError(
      "COGNITO_CREATE_USER: Failed while checking whether the user already exists.",
      error,
      {
        username: input.cognito.Username,
        userPoolId: input.cognito.UserPoolId,
      },
    );
  }

  try {
    const createResult = await cognito.createUser(input.cognito);

    if (!createResult.ok) {
      return createResult;
    }

    const createOutput = createResult.body as AdminCreateUserCommandOutput;
    const user: CognitoUserType | undefined = createOutput.User;
    createdUsername = user?.Username ?? input.cognito.Username;

    if (!user) {
      const missingUser = ciError400<CICognitoUser>(
        "COGNITO_CREATE_USER: Cognito did not return a User object after the create operation.",
        {
          username: input.cognito.Username,
          userPoolId: input.cognito.UserPoolId,
          createOutput,
        },
      );
      try {
        await rollbackCreatedUser();
      } catch (rollbackError) {
        return ciBuildCognitoError(
          "COGNITO_CREATE_USER: Cognito returned no user and rollback failed.",
          rollbackError,
          {
            username: input.cognito.Username,
            userPoolId: input.cognito.UserPoolId,
          },
        );
      }
      return missingUser;
    }

    if (input.setPassword) {
      const password = input.password ?? cognito.generatePassword();

      const passwordResult = await cognito.setUserPassword({
        UserPoolId: input.cognito.UserPoolId,
        Username: user.Username,
        Password: password,
        Permanent: input.permanent ?? false,
      });
      if (!passwordResult.ok) {
        try {
          await rollbackCreatedUser();
        } catch (rollbackError) {
          return ciBuildCognitoError(
            "COGNITO_CREATE_USER: Password setup failed and rollback also failed.",
            new AggregateError([passwordResult.body, rollbackError]),
            {
              username: input.cognito.Username,
              userPoolId: input.cognito.UserPoolId,
            },
          );
        }
        return passwordResult;
      }
    }

    if (input.groups?.length) {
      const client = await cognito.getIdentityProviderClient();
      for (const groupName of Array.from(new Set(input.groups)).sort()) {
        await client.send(
          new AdminAddUserToGroupCommand({
            UserPoolId: input.cognito.UserPoolId,
            Username: user.Username,
            GroupName: groupName,
          }),
        );
      }
    }

    return ciOk200(ciMapCognitoUser(user));
  } catch (error: unknown) {
    let reportedError = error;
    try {
      await rollbackCreatedUser();
    } catch (rollbackError) {
      reportedError = new AggregateError([error, rollbackError]);
    }
    return ciBuildCognitoError(
      "COGNITO_CREATE_USER: Failed to create the Cognito user.",
      reportedError,
      {
        username: input.cognito.Username,
        userPoolId: input.cognito.UserPoolId,
      },
    );
  }
}
