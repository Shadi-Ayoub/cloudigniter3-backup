import assert from "node:assert/strict";
import test from "node:test";
import {
  AdminAddUserToGroupCommand,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  type CognitoIdentityProviderClient,
  ListUsersInGroupCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import {
  type DynamoDBDocumentClient,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { CI_COGNITO_ROOT_USER_GROUP } from "@ci-aws/lib";
import {
  ciBootstrapRootUser,
  ciEnsureCognitoRootUserMarker,
} from "@ci-aws/server/backend";

function rootUserRecord() {
  return {
    Username: "root@example.com",
    Enabled: true,
    UserStatus: "CONFIRMED" as const,
    UserAttributes: [
      { Name: "sub", Value: "root-subject" },
      { Name: "email", Value: "root@example.com" },
    ],
    $metadata: {},
  };
}

test("bootstraps one Root marker while keeping it out of profile roles", async () => {
  const cognitoCommands: unknown[] = [];
  const cognitoClient = {
    async send(command: unknown) {
      cognitoCommands.push(command);
      if (command instanceof AdminGetUserCommand) return rootUserRecord();
      if (command instanceof ListUsersInGroupCommand) return { Users: [] };
      if (command instanceof AdminUpdateUserAttributesCommand) return {};
      if (command instanceof AdminAddUserToGroupCommand) return {};
      throw new Error(`Unexpected Cognito command: ${String(command)}`);
    },
  } as unknown as CognitoIdentityProviderClient;

  let profileUpdate: UpdateCommand | undefined;
  const documentClient = {
    async send(command: unknown) {
      assert.ok(command instanceof UpdateCommand);
      profileUpdate = command;
      return {};
    },
  } as unknown as DynamoDBDocumentClient;

  const result = await ciBootstrapRootUser(
    {
      region: "eu-west-1",
      userPoolId: "eu-west-1_example",
      userProfileTableName: "UserProfile-example",
      rootUser: {
        email: "root@example.com",
        givenName: "CloudIgniter",
        familyName: "Root",
      },
      groups: ["admin", CI_COGNITO_ROOT_USER_GROUP, "admin"],
      passwordProvider: async () => {
        throw new Error("A confirmed Root User must not request a password.");
      },
    },
    { cognitoClient, documentClient },
  );

  const addedGroups = cognitoCommands
    .filter(
      (command): command is AdminAddUserToGroupCommand =>
        command instanceof AdminAddUserToGroupCommand,
    )
    .map((command) => command.input.GroupName)
    .sort();
  assert.deepEqual(addedGroups, [
    "admin",
    CI_COGNITO_ROOT_USER_GROUP,
    "system-super-admin",
  ]);
  assert.deepEqual(result.groups, ["system-super-admin", "admin"]);
  assert.equal(result.isRootUser, true);

  assert.ok(profileUpdate);
  assert.equal(
    profileUpdate.input.ExpressionAttributeValues?.[":isRootUser"],
    true,
  );
  assert.deepEqual(profileUpdate.input.ExpressionAttributeValues?.[":roles"], [
    "system-super-admin",
    "admin",
  ]);
});

test("keeps an existing Root marker idempotent", async () => {
  const commands: unknown[] = [];
  const client = {
    async send(command: unknown) {
      commands.push(command);
      if (command instanceof ListUsersInGroupCommand) {
        return { Users: [{ Username: "root@example.com" }] };
      }
      throw new Error(`Unexpected Cognito command: ${String(command)}`);
    },
  } as unknown as CognitoIdentityProviderClient;

  await ciEnsureCognitoRootUserMarker(
    client,
    "eu-west-1_example",
    "root@example.com",
  );

  assert.equal(
    commands.some((command) => command instanceof AdminAddUserToGroupCommand),
    false,
  );
});

test("rejects a Root marker owned by another account across paginated results", async () => {
  const client = {
    async send(command: unknown) {
      assert.ok(command instanceof ListUsersInGroupCommand);
      if (!command.input.NextToken) {
        return {
          Users: [{ Username: "root@example.com" }],
          NextToken: "root-members-page-2",
        };
      }
      return { Users: [{ Username: "other-root@example.com" }] };
    },
  } as unknown as CognitoIdentityProviderClient;

  await assert.rejects(
    () =>
      ciEnsureCognitoRootUserMarker(
        client,
        "eu-west-1_example",
        "root@example.com",
      ),
    /already belongs to "other-root@example.com"/,
  );
});
