import assert from "node:assert/strict";
import { test, mock } from "node:test";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { ciCreateAppAccessControl } from "@cloudigniter/core/lib";
import type { CiAppSyncResolverEvent } from "../../src/types";
import { ciCheckReadOnlyAccess } from "../../src/server/backend/access-control/ci-check-read-only-access";
import { ciPutEmberguardCustomDomainHandler } from "../../src/server/backend/handlers/emberguard-handlers/ci-emberguard-access-handlers";

const definition = ciCreateAppAccessControl({
  roles: [
    {
      id: "auditor",
      title: "Auditor",
      precedence: 500,
      privileges: [
        {
          id: "audit-platform",
          title: "Audit platform",
          effect: "allow",
          resource: "platform.*",
          action: "read",
          scopeKinds: ["system"],
          readOnly: true,
        },
      ],
    },
  ],
});
function event(
  groups: string[] = ["system-super-admin"],
): CiAppSyncResolverEvent {
  return {
    arguments: { inputString: "{}" },
    identity: { claims: { sub: "actor", "cognito:groups": groups } },
  } as unknown as CiAppSyncResolverEvent;
}
const assignment = {
  id: "audit-assignment",
  subjectId: "actor",
  roleId: "auditor",
  scope: { kind: "system" },
  propagation: "exact",
};

test("legacy mutation guard reads current policy and paginated subject assignments before a write", async () => {
  process.env.CI_EMBERGUARD_ACCESS_TABLE = "access";
  const client = DynamoDBDocumentClient.from(
    new DynamoDBClient({ region: "us-east-1" }),
  );
  const calls: (GetCommand | QueryCommand)[] = [];
  const send = mock.method(
    client,
    "send",
    async (command: GetCommand | QueryCommand) => {
      calls.push(command);
      if (command instanceof GetCommand)
        return { Item: { state: { definition } } };
      return command.input.ExclusiveStartKey
        ? { Items: [assignment] }
        : { Items: [], LastEvaluatedKey: { PK: "cursor" } };
    },
  );
  try {
    await assert.rejects(
      () =>
        ciCheckReadOnlyAccess(
          event(),
          [{ resource: "platform.tenants", action: "create" }],
          client,
        ),
      /Read-only access blocks/,
    );
    assert.equal(calls.length, 3);
    for (const call of calls) assert.equal(call.input.ConsistentRead, true);
    const query = calls[1] as QueryCommand;
    assert.equal(
      query.input.ExpressionAttributeValues?.[":pk"],
      "CI#EMBERGUARD#SUBJECT#actor#ROLE_ASSIGNMENTS",
    );
    assert.equal(query.input.IndexName, undefined);
    await ciCheckReadOnlyAccess(
      event(),
      [{ resource: "platform.tenants", action: "read" }],
      client,
    );
  } finally {
    send.mock.restore();
  }
});

test("expired assignment does not restrict access, and storage failures fail closed", async () => {
  process.env.CI_EMBERGUARD_ACCESS_TABLE = "access";
  const client = DynamoDBDocumentClient.from(
    new DynamoDBClient({ region: "us-east-1" }),
  );
  const send = mock.method(
    client,
    "send",
    async (command: GetCommand | QueryCommand) =>
      command instanceof GetCommand
        ? { Item: { state: { definition } } }
        : { Items: [{ ...assignment, expiresAt: "2000-01-01T00:00:00Z" }] },
  );
  try {
    await ciCheckReadOnlyAccess(
      event(),
      [{ resource: "platform.tenants", action: "delete" }],
      client,
    );
  } finally {
    send.mock.restore();
  }
  const failed = mock.method(client, "send", async () => {
    throw new Error("Policy unavailable");
  });
  try {
    await assert.rejects(
      () =>
        ciCheckReadOnlyAccess(
          event(),
          [{ resource: "platform.tenants", action: "delete" }],
          client,
        ),
      /Policy unavailable/,
    );
  } finally {
    failed.mock.restore();
  }
});

test("direct backend mutation cannot bypass a forced restriction using a super-administrator group", async () => {
  process.env.CI_EMBERGUARD_ACCESS_TABLE = "access";
  const send = mock.method(
    DynamoDBDocumentClient.prototype,
    "send",
    async (command: GetCommand | QueryCommand) => {
      if (command instanceof GetCommand)
        return { Item: { state: { definition } } };
      assert.equal(
        command instanceof QueryCommand,
        true,
        "no write may reach DynamoDB",
      );
      return { Items: [assignment] };
    },
  );
  try {
    const response = await ciPutEmberguardCustomDomainHandler(event());
    assert.equal(response.ok, false);
    assert.match(JSON.stringify(response.body), /Read-only access blocks/);
  } finally {
    send.mock.restore();
  }
});

test("a global user-management restriction also vetoes the system administrator path", async () => {
  process.env.CI_EMBERGUARD_ACCESS_TABLE = "access";
  const policy = ciCreateAppAccessControl({ roles: [{
    id: "user-auditor", title: "User auditor", precedence: 900,
    privileges: [{ id: "audit-users", title: "Audit users", effect: "allow", resource: "identity.users", action: "read", scopeKinds: ["global"], readOnly: true }],
  }] });
  const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "us-east-1" }));
  const send = mock.method(client, "send", async (command: GetCommand | QueryCommand) => command instanceof GetCommand
    ? { Item: { state: { definition: policy } } } : { Items: [] });
  try {
    await assert.rejects(() => ciCheckReadOnlyAccess(event(["system-super-admin", "user-auditor"]), [{ resource: "identity.users", action: "update" }], client), /Read-only access blocks/);
  } finally { send.mock.restore(); }
});
