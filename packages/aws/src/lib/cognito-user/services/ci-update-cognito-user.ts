import {
  AdminAddUserToGroupCommand,
  AdminListGroupsForUserCommand,
  AdminRemoveUserFromGroupCommand,
  type UserType as CognitoUserType,
} from "@aws-sdk/client-cognito-identity-provider";
import { ciOk200 } from "@cloudigniter/core/lib";
import type { CiResult } from "@cloudigniter/core/types";
import { ciBuildCognitoError, ciCreateCognitoClient } from "@ci-aws/lib";
import type { CiUpdateCognitoUserInterface } from "@ci-aws/types";

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

    if (input.cognito.UserAttributes.length) {
      const updateResult = await cognito.updateUser(input.cognito);
      if (!updateResult.ok) return updateResult;
    }

    if (input.groups) {
      const client = await cognito.getIdentityProviderClient();
      const current = await client.send(
        new AdminListGroupsForUserCommand({
          UserPoolId: input.cognito.UserPoolId,
          Username: input.cognito.Username,
        }),
      );
      const currentNames = new Set(
        (current.Groups ?? [])
          .map((group) => group.GroupName)
          .filter((name): name is string => Boolean(name)),
      );
      const desiredNames = new Set(
        input.groups.map((name) => name.trim()).filter(Boolean),
      );
      for (const groupName of [...currentNames].filter(
        (name) => !desiredNames.has(name),
      )) {
        await client.send(
          new AdminRemoveUserFromGroupCommand({
            UserPoolId: input.cognito.UserPoolId,
            Username: input.cognito.Username,
            GroupName: groupName,
          }),
        );
      }
      for (const groupName of [...desiredNames].filter(
        (name) => !currentNames.has(name),
      )) {
        await client.send(
          new AdminAddUserToGroupCommand({
            UserPoolId: input.cognito.UserPoolId,
            Username: input.cognito.Username,
            GroupName: groupName,
          }),
        );
      }
    }

    const user = await cognito.getUser({
      UserPoolId: input.cognito.UserPoolId,
      Username: input.cognito.Username,
    });
    if (!user.ok) return user;

    return ciOk200(user.body as CognitoUserType);
  } catch (error: unknown) {
    return ciBuildCognitoError(
      "COGNITO_UPDATE_USER: Failed to update the Cognito user.",
      error,
      {
        username: input.cognito.Username,
        userPoolId: input.cognito.UserPoolId,
        attributesCount: input.cognito.UserAttributes.length,
        groupsCount: input.groups?.length,
      },
    );
  }
}
