import {
  AdminListGroupsForUserCommand,
  type CognitoIdentityProviderClient,
  type GroupType,
} from "@aws-sdk/client-cognito-identity-provider";

type CiListCognitoUserGroupsInput = {
  userPoolId: string;
  username: string;
};

/** Loads every Cognito group page for one user. */
export async function ciListCognitoUserGroups(
  client: CognitoIdentityProviderClient,
  input: CiListCognitoUserGroupsInput,
): Promise<GroupType[]> {
  const groups: GroupType[] = [];
  const seenTokens = new Set<string>();
  let nextToken: string | undefined;

  do {
    const response = await client.send(
      new AdminListGroupsForUserCommand({
        UserPoolId: input.userPoolId,
        Username: input.username,
        Limit: 60,
        ...(nextToken ? { NextToken: nextToken } : {}),
      }),
    );
    groups.push(...(response.Groups ?? []));

    const responseToken = response.NextToken;
    if (responseToken && seenTokens.has(responseToken)) {
      throw new Error(
        `Cognito repeated the group pagination token for user "${input.username}".`,
      );
    }
    if (responseToken) seenTokens.add(responseToken);
    nextToken = responseToken;
  } while (nextToken);

  return groups;
}
