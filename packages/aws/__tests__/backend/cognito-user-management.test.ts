import assert from "node:assert/strict";
import test from "node:test";
import { ciMapCognitoUser } from "@ci-aws/lib";

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
  assert.equal(user.identityProvider.label, "Amazon Cognito");
  assert.equal(user.identityProvider.kind, "native");
  assert.equal(user.createdAt, "2026-01-02T03:04:05.000Z");
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
