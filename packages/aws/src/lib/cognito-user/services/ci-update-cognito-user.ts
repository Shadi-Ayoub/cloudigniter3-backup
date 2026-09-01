import {
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { ciError400, ciOk200 } from "@cloudigniter/core/lib";
import type { CiResult } from "@cloudigniter/core/types";
import {
  CI_COGNITO_ROOT_USER_GROUP,
  ciBuildCognitoError,
  ciCreateCognitoClient,
  ciMapCognitoUser,
} from "@ci-aws/lib";
import type {
  CICognitoUser,
  CiUpdateCognitoUserInterface,
} from "@ci-aws/types";
import { ciListCognitoUserGroups } from "./helpers";

/**
 * Successful result returned by `updateCognitoUser`.
 */
export type CiUpdateCognitoUserResult = CiResult<CICognitoUser>;

/**
 * Update a Cognito user, then re-fetch and return the updated record.
 */
export async function ciUpdateCognitoUser(
  input: CiUpdateCognitoUserInterface,
): Promise<CiUpdateCognitoUserResult> {
  try {
    if (
      input.groups?.some(
        (groupName) => groupName.trim() === CI_COGNITO_ROOT_USER_GROUP,
      )
    ) {
      return ciError400<CICognitoUser>(
        `COGNITO_UPDATE_USER: The group "${CI_COGNITO_ROOT_USER_GROUP}" is reserved for Root User bootstrap.`,
      );
    }
    const cognito = await ciCreateCognitoClient(input.CognitoClientConfig);

    if (input.cognito.UserAttributes.length) {
      const updateResult = await cognito.updateUser(input.cognito);
      if (!updateResult.ok) return updateResult;
    }

    if (input.groups) {
      const client = await cognito.getIdentityProviderClient();
      const current = await ciListCognitoUserGroups(client, {
        userPoolId: input.cognito.UserPoolId,
        username: input.cognito.Username,
      });
      const currentNames = new Set(
        current
          .map((group) => group.GroupName)
          .filter((name): name is string => Boolean(name)),
      );
      const desiredNames = new Set(
        input.groups.map((name) => name.trim()).filter(Boolean),
      );
      for (const groupName of [...currentNames].filter(
        (name) =>
          name !== CI_COGNITO_ROOT_USER_GROUP && !desiredNames.has(name),
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

    const client = await cognito.getIdentityProviderClient();
    const groups = await ciListCognitoUserGroups(client, {
      userPoolId: input.cognito.UserPoolId,
      username: input.cognito.Username,
    });
    return ciOk200(ciMapCognitoUser(user.body, groups));
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
