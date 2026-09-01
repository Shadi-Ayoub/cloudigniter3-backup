import {
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  AdminGetUserCommand,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient,
  ListUsersInGroupCommand,
  UserNotFoundException,
  type AdminGetUserCommandOutput,
} from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { CI_COGNITO_ROOT_USER_GROUP } from "@ci-aws/lib";

import { ciGetRootUserPasswordProblems } from "./ci-get-root-user-password-problems";
import type {
  CiBootstrapRootUserInput,
  CiBootstrapRootUserResult,
} from "./types";

const CI_ROOT_USER_GROUPS = ["system-super-admin"] as const;

type CiBootstrapRootUserDependencies = {
  cognitoClient?: CognitoIdentityProviderClient;
  documentClient?: DynamoDBDocumentClient;
};

function ciRequireNonEmptyString(value: string, field: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`[ciBootstrapRootUser] "${field}" must not be empty.`);
  }

  return normalizedValue;
}

function ciGetCognitoAttribute(
  user: AdminGetUserCommandOutput,
  attributeName: string,
): string | undefined {
  return user.UserAttributes?.find(
    (attribute) => attribute.Name === attributeName,
  )?.Value;
}

function ciIsUserNotFoundError(error: unknown): boolean {
  return (
    error instanceof UserNotFoundException ||
    (error instanceof Error && error.name === "UserNotFoundException")
  );
}

async function ciGetCognitoRootUser(
  client: CognitoIdentityProviderClient,
  userPoolId: string,
  email: string,
): Promise<AdminGetUserCommandOutput | null> {
  try {
    return await client.send(
      new AdminGetUserCommand({
        UserPoolId: userPoolId,
        Username: email,
      }),
    );
  } catch (error: unknown) {
    if (ciIsUserNotFoundError(error)) {
      return null;
    }

    throw error;
  }
}

/** Ensures the reserved Root marker belongs to this user and no other account. */
export async function ciEnsureCognitoRootUserMarker(
  client: CognitoIdentityProviderClient,
  userPoolId: string,
  username: string,
): Promise<void> {
  const markerUsernames = new Set<string>();
  const seenTokens = new Set<string>();
  let nextToken: string | undefined;

  do {
    const response = await client.send(
      new ListUsersInGroupCommand({
        UserPoolId: userPoolId,
        GroupName: CI_COGNITO_ROOT_USER_GROUP,
        Limit: 60,
        ...(nextToken ? { NextToken: nextToken } : {}),
      }),
    );

    for (const markerUser of response.Users ?? []) {
      if (!markerUser.Username) {
        throw new Error(
          `[ciBootstrapRootUser] Cognito returned a Root marker member without a username.`,
        );
      }
      markerUsernames.add(markerUser.Username);
    }

    const responseToken = response.NextToken;
    if (responseToken && seenTokens.has(responseToken)) {
      throw new Error(
        `[ciBootstrapRootUser] Cognito repeated the Root marker pagination token.`,
      );
    }
    if (responseToken) seenTokens.add(responseToken);
    nextToken = responseToken;
  } while (nextToken);

  const conflictingUsername = [...markerUsernames].find(
    (markerUsername) => markerUsername !== username,
  );
  if (conflictingUsername) {
    throw new Error(
      `[ciBootstrapRootUser] The reserved group "${CI_COGNITO_ROOT_USER_GROUP}" already belongs to "${conflictingUsername}". Root ownership must be resolved explicitly.`,
    );
  }

  if (markerUsernames.has(username)) return;

  await client.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: userPoolId,
      Username: username,
      GroupName: CI_COGNITO_ROOT_USER_GROUP,
    }),
  );
}

/**
 * Creates or repairs a root Cognito account and its Amplify UserProfile item.
 *
 * The operation is convergent: rerunning it repairs missing groups or a missing
 * profile without resetting the password of an already confirmed user.
 */
export async function ciBootstrapRootUser(
  input: CiBootstrapRootUserInput,
  dependencies: CiBootstrapRootUserDependencies = {},
): Promise<CiBootstrapRootUserResult> {
  const region = ciRequireNonEmptyString(input.region, "region");
  const userPoolId = ciRequireNonEmptyString(input.userPoolId, "userPoolId");
  const userProfileTableName = ciRequireNonEmptyString(
    input.userProfileTableName,
    "userProfileTableName",
  );
  const email = ciRequireNonEmptyString(
    input.rootUser.email,
    "rootUser.email",
  ).toLowerCase();
  const givenName = ciRequireNonEmptyString(
    input.rootUser.givenName,
    "rootUser.givenName",
  );
  const familyName = ciRequireNonEmptyString(
    input.rootUser.familyName,
    "rootUser.familyName",
  );
  const configuredGroups = (input.groups ?? [])
    .map((group) => ciRequireNonEmptyString(group, "groups[]"))
    .filter((group) => group !== CI_COGNITO_ROOT_USER_GROUP);
  const groups = Array.from(
    new Set<string>([...CI_ROOT_USER_GROUPS, ...configuredGroups]),
  );
  const cognitoClient =
    dependencies.cognitoClient ?? new CognitoIdentityProviderClient({ region });
  let cognitoUser = await ciGetCognitoRootUser(
    cognitoClient,
    userPoolId,
    email,
  );
  const cognitoUserCreated = cognitoUser === null;

  if (!cognitoUser) {
    await cognitoClient.send(
      new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: email,
        MessageAction: "SUPPRESS",
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "email_verified", Value: "true" },
          { Name: "given_name", Value: givenName },
          { Name: "family_name", Value: familyName },
        ],
      }),
    );

    cognitoUser = await ciGetCognitoRootUser(cognitoClient, userPoolId, email);
  }

  if (!cognitoUser?.Username) {
    throw new Error(
      `[ciBootstrapRootUser] Cognito did not return the root user "${email}" after creation.`,
    );
  }

  const username = cognitoUser.Username;
  const passwordSet =
    cognitoUserCreated || cognitoUser.UserStatus !== "CONFIRMED";

  await ciEnsureCognitoRootUserMarker(cognitoClient, userPoolId, username);

  if (passwordSet) {
    const password = await input.passwordProvider();
    const passwordProblems = ciGetRootUserPasswordProblems(
      password,
      input.passwordPolicy,
    );

    if (passwordProblems.length > 0) {
      throw new Error(
        `[ciBootstrapRootUser] The password must contain ${passwordProblems.join(", ")}.`,
      );
    }

    await cognitoClient.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: username,
        Password: password,
        Permanent: true,
      }),
    );
  }

  await cognitoClient.send(
    new AdminUpdateUserAttributesCommand({
      UserPoolId: userPoolId,
      Username: username,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "email_verified", Value: "true" },
        { Name: "given_name", Value: givenName },
        { Name: "family_name", Value: familyName },
      ],
    }),
  );

  for (const group of groups) {
    await cognitoClient.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: userPoolId,
        Username: username,
        GroupName: group,
      }),
    );
  }

  const refreshedUser = await ciGetCognitoRootUser(
    cognitoClient,
    userPoolId,
    email,
  );

  if (!refreshedUser) {
    throw new Error(
      `[ciBootstrapRootUser] Cognito user "${email}" disappeared during bootstrap.`,
    );
  }

  const cognitoSub = ciRequireNonEmptyString(
    ciGetCognitoAttribute(refreshedUser, "sub") ?? "",
    "Cognito sub",
  );
  const profileOwner = `${cognitoSub}::${username}`;
  const now = new Date().toISOString();
  const documentClient =
    dependencies.documentClient ??
    DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

  await documentClient.send(
    new UpdateCommand({
      TableName: userProfileTableName,
      Key: { userId: cognitoSub },
      UpdateExpression: [
        "SET #username = :username",
        "#email = :email",
        "#profileOwner = :profileOwner",
        "#roles = :roles",
        "#isRootUser = :isRootUser",
        "#status = if_not_exists(#status, :status)",
        "#deletionState = if_not_exists(#deletionState, :activeDeletionState)",
        "#type = if_not_exists(#type, :type)",
        "#createdAt = if_not_exists(#createdAt, :now)",
        "#updatedAt = :now",
      ].join(", "),
      ConditionExpression:
        "attribute_not_exists(#userId) OR #profileOwner = :profileOwner",
      ExpressionAttributeNames: {
        "#userId": "userId",
        "#username": "username",
        "#email": "email",
        "#profileOwner": "profileOwner",
        "#roles": "roles",
        "#isRootUser": "isRootUser",
        "#status": "status",
        "#deletionState": "deletionState",
        "#type": "__typename",
        "#createdAt": "createdAt",
        "#updatedAt": "updatedAt",
      },
      ExpressionAttributeValues: {
        ":username": username,
        ":email": email,
        ":profileOwner": profileOwner,
        ":roles": groups,
        ":isRootUser": true,
        ":status": "active",
        ":activeDeletionState": "active",
        ":type": "UserProfile",
        ":now": now,
      },
    }),
  );

  return {
    email,
    username,
    userId: cognitoSub,
    cognitoSub,
    profileOwner,
    groups,
    isRootUser: true,
    cognitoUserCreated,
    passwordSet,
  };
}
