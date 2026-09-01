import assert from "node:assert/strict";
import test from "node:test";
import {
  AdminListGroupsForUserCommand,
  type CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";
import { CI_COGNITO_ROOT_USER_GROUP, ciMapCognitoUser } from "@ci-aws/lib";
import { ciListCognitoUserGroups } from "@ci-aws/lib/cognito-user/services/helpers";

test("normalizes Cognito identity fields used by User administration", () => {
  const user = ciMapCognitoUser({
    Username: "person@example.com",
    Enabled: true,
    UserStatus: "CONFIRMED",
    UserCreateDate: new Date("2026-01-02T03:04:05.000Z"),
    UserLastModifiedDate: new Date("2026-02-03T04:05:06.000Z"),
    Attributes: [
      { Name: "sub", Value: "subject-123" },
      { Name: "email", Value: "person@example.com" },
      { Name: "email_verified", Value: "true" },
      { Name: "given_name", Value: "Amina" },
      { Name: "family_name", Value: "Rahman" },
    ],
  });

  assert.equal(user.id, "subject-123");
  assert.equal(user.username, "person@example.com");
  assert.equal(user.emailVerified, true);
  assert.equal(user.givenName, "Amina");
  assert.equal(user.familyName, "Rahman");
  assert.equal(user.attributes.given_name, "Amina");
  assert.equal(user.isRootUser, false);
  assert.deepEqual(user.groups, []);
  assert.equal(user.identityProvider.label, "Amazon Cognito");
  assert.equal(user.identityProvider.kind, "native");
  assert.equal(user.createdAt, "2026-01-02T03:04:05.000Z");
});

test("derives Root status from the reserved group without exposing it as a role", () => {
  const user = ciMapCognitoUser(
    {
      Username: "root@example.com",
      Enabled: true,
      UserStatus: "CONFIRMED",
      Attributes: [{ Name: "sub", Value: "root-subject" }],
    },
    [
      { GroupName: "system-super-admin", Precedence: 0 },
      { GroupName: CI_COGNITO_ROOT_USER_GROUP, Precedence: 60 },
    ],
  );

  assert.equal(user.isRootUser, true);
  assert.deepEqual(user.groups, [{ id: "system-super-admin", precedence: 0 }]);
});

test("normalizes AdminGetUser attributes and complete Cognito groups", () => {
  const user = ciMapCognitoUser(
    {
      Username: "person@example.com",
      Enabled: true,
      UserStatus: "CONFIRMED",
      UserAttributes: [
        { Name: "sub", Value: "subject-admin-get" },
        { Name: "email", Value: "person@example.com" },
        { Name: "given_name", Value: "Amina" },
        { Name: "family_name", Value: "Rahman" },
      ],
      $metadata: {},
    },
    [
      { GroupName: "developer", Precedence: 40 },
      { GroupName: "system-super-admin", Precedence: 0 },
      { GroupName: "admin", Description: "Application admins", Precedence: 30 },
      { GroupName: "admin", Precedence: 30 },
    ],
  );

  assert.equal(user.id, "subject-admin-get");
  assert.equal(user.email, "person@example.com");
  assert.equal(user.givenName, "Amina");
  assert.equal(user.familyName, "Rahman");
  assert.deepEqual(user.groups, [
    { id: "system-super-admin", precedence: 0 },
    {
      id: "admin",
      precedence: 30,
      description: "Application admins",
    },
    { id: "developer", precedence: 40 },
  ]);
});

test("loads every AdminListGroupsForUser page", async () => {
  const requestedTokens: Array<string | undefined> = [];
  const client = {
    async send(command: AdminListGroupsForUserCommand) {
      assert.ok(command instanceof AdminListGroupsForUserCommand);
      requestedTokens.push(command.input.NextToken);
      if (!command.input.NextToken) {
        return {
          Groups: [{ GroupName: "admin", Precedence: 30 }],
          NextToken: "groups-page-2",
        };
      }
      return {
        Groups: [{ GroupName: "developer", Precedence: 40 }],
      };
    },
  } as unknown as CognitoIdentityProviderClient;

  const groups = await ciListCognitoUserGroups(client, {
    userPoolId: "eu-west-1_example",
    username: "person@example.com",
  });

  assert.deepEqual(requestedTokens, [undefined, "groups-page-2"]);
  assert.deepEqual(
    groups.map((group) => group.GroupName),
    ["admin", "developer"],
  );
});

test("surfaces a federated identity provider without leaking raw SDK shape", () => {
  const user = ciMapCognitoUser({
    Username: "Google_123",
    Enabled: true,
    UserStatus: "EXTERNAL_PROVIDER",
    Attributes: [
      { Name: "sub", Value: "subject-456" },
      {
        Name: "identities",
        Value: JSON.stringify([{ providerName: "Google" }]),
      },
    ],
  });

  assert.deepEqual(user.identityProvider, {
    id: "Google",
    label: "Google",
    kind: "federated",
  });
});
