import assert from "node:assert/strict";
import { test, mock } from "node:test";
import {
  CloudFormationClient,
  CreateStackCommand,
  DeleteStackCommand,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { ciCreateAwsExtensionProvider } from "../../src/server/backend/modules/ci-aws-extension-provider";
import {
  ciCreateAwsExtensionStore,
  ciExtensionRegistryKey,
} from "../../src/server/backend/modules/ci-aws-extension-store";
import { ciCreateAwsTodoModule } from "../../src/server/backend/modules/ci-aws-todo-module";
import { ciCreateAwsExtensionHandlers } from "../../src/server/backend/modules/ci-aws-extension-handlers";
import { ciAwsExtensionPolicies } from "../../src/server/backend/modules/ci-aws-extension-policies";
import {
  ciCreateAppAccessControl,
  ciExtensionAccessControl,
} from "@cloudigniter/core/lib";
import type {
  CiExtensionManifest,
  CiExtensionInstallation,
  CiExtensionSnapshot,
} from "@cloudigniter/core/types";
import type {
  CiAppSyncResolverEvent,
  CiAwsExtensionExecutionContext,
} from "../../src/types";

const manifest: CiExtensionManifest = {
  schemaVersion: 1,
  kind: "extension",
  id: "todo",
  name: "Tasks",
  version: "1.0.0",
  runtime: { client: true, server: true },
  target: { framework: "next", clouds: ["aws"] },
  authenticatedAccess: true,
  permissions: [
    { id: "read-own", title: "Read own", accessMode: "read" },
    { id: "write-own", title: "Write own", accessMode: "write" },
  ],
};
const prefix = "ci-ext-0123456789ab";
const stackName = `${prefix}-todo`;
const stackId = `arn:aws:cloudformation:us-east-1:123456789012:stack/${stackName}/guid`;
const record = (): CiExtensionInstallation => ({
  manifest,
  status: "installing",
  operation: "install",
  operationId: "op-1",
  infrastructure: { provider: "aws", id: stackName },
  configuration: {},
  updatedAt: "2026-09-18T00:00:00.000Z",
  updatedBy: "developer",
});
const db = () =>
  DynamoDBDocumentClient.from(new DynamoDBClient({ region: "us-east-1" }));
const ownedStack = (StackStatus = "CREATE_COMPLETE") => ({
  StackName: stackName,
  StackId: stackId,
  StackStatus,
  Tags: [
    { Key: "CloudIgniterEnvironment", Value: prefix },
    { Key: "CloudIgniterModule", Value: "todo" },
  ],
  Outputs: [{ OutputKey: "TableName", OutputValue: stackName }],
});
function provider() {
  const client = new CloudFormationClient({ region: "us-east-1" });
  return {
    client,
    provider: ciCreateAwsExtensionProvider({
      client,
      definitions: [ciCreateAwsTodoModule(manifest)],
      prefix,
      account: "123456789012",
      region: "us-east-1",
      partition: "aws",
      serviceRoleArn: "arn:aws:iam::123456789012:role/modules",
    }),
  };
}
test("AWS install uses a deterministic owned stack, scoped service role, and stable operation token", async () => {
  const f = provider();
  const calls: (CreateStackCommand | DescribeStacksCommand)[] = [];
  mock.method(
    f.client,
    "send",
    async (command: CreateStackCommand | DescribeStacksCommand) => {
      calls.push(command);
      if (command instanceof DescribeStacksCommand)
        throw Object.assign(new Error("Stack does not exist"), {
          name: "ValidationError",
        });
      return { StackId: stackId };
    },
  );
  await f.provider.install(record());
  const create = calls.find((call) => call instanceof CreateStackCommand)!;
  assert.equal(create.input.StackName, stackName);
  assert.equal(create.input.ClientRequestToken, "op-1");
  assert.match(create.input.RoleARN!, /role\/modules$/);
  const template = JSON.parse(create.input.TemplateBody!);
  assert.equal(
    template.Resources.Tasks.Properties.BillingMode,
    "PAY_PER_REQUEST",
  );
  assert.equal(template.Resources.Tasks.DeletionPolicy, "Delete");
  assert.equal(
    template.Resources.Tasks.Properties.GlobalSecondaryIndexes,
    undefined,
  );
});
test("AWS retry observes the existing stack instead of creating duplicate infrastructure", async () => {
  const f = provider();
  const calls: unknown[] = [];
  mock.method(f.client, "send", async (command: unknown) => {
    calls.push(command);
    return { Stacks: [ownedStack()] };
  });
  await f.provider.install(record());
  assert.equal(calls.length, 1);
  const state = await f.provider.inspect(record());
  assert.equal(state.status, "ready");
  assert.equal(state.infrastructure?.id, stackId);
  assert.equal(state.infrastructure?.outputs?.TableName, stackName);
});
test("AWS refuses parent/nested/unowned/cross-environment stack deletion", async () => {
  for (const badStack of [
    { ...ownedStack(), ParentId: "amplify-root" },
    { ...ownedStack(), Tags: [] },
    { ...ownedStack(), StackName: "amplify-root" },
    { ...ownedStack(), StackId: stackId.replace("us-east-1", "us-west-2") },
  ]) {
    const f = provider();
    const calls: unknown[] = [];
    mock.method(f.client, "send", async (command: unknown) => {
      calls.push(command);
      return { Stacks: [badStack] };
    });
    await assert.rejects(
      () => f.provider.uninstall(record()),
      /ownership mismatch/,
    );
    assert.equal(calls.length, 1);
  }
  const f = provider();
  mock.method(f.client, "send", async () => {
    throw new Error("should not call AWS");
  });
  await assert.rejects(
    () =>
      f.provider.uninstall({
        ...record(),
        infrastructure: { provider: "aws", id: "amplify-root" },
      }),
    /ownership mismatch/,
  );
});
test("AWS deletes by the verified ARN and preserves delete failures for recovery", async () => {
  const f = provider();
  const calls: unknown[] = [];
  mock.method(f.client, "send", async (command: unknown) => {
    calls.push(command);
    return { Stacks: [ownedStack("DELETE_FAILED")] };
  });
  assert.equal((await f.provider.inspect(record())).status, "failed");
  await f.provider.uninstall(record());
  const deleted = calls.find(
    (call) => call instanceof DeleteStackCommand,
  ) as DeleteStackCommand;
  assert.equal(deleted.input.StackName, stackId);
});
test("access denied is not mistaken for a missing stack", async () => {
  const f = provider();
  mock.method(f.client, "send", async () => {
    throw Object.assign(new Error("Access denied"), { name: "AccessDenied" });
  });
  await assert.rejects(() => f.provider.inspect(record()), /Access denied/);
});
test("registry reads are consistent and writes have atomic revision conditions", async () => {
  const client = db();
  const calls: (GetCommand | PutCommand)[] = [];
  mock.method(client, "send", async (command: GetCommand | PutCommand) => {
    calls.push(command);
    return {};
  });
  const store = ciCreateAwsExtensionStore(client, "registry");
  assert.deepEqual(await store.read(), { revision: 0, installations: {} });
  await store.write({ revision: 1, installations: {} }, 0);
  await store.write({ revision: 2, installations: {} }, 1);
  assert.ok(calls[0] instanceof GetCommand);
  assert.ok(calls[1] instanceof PutCommand);
  assert.ok(calls[2] instanceof PutCommand);
  assert.equal(calls[0].input.ConsistentRead, true);
  assert.deepEqual(ciExtensionRegistryKey(), {
    PK: "CI#MODULES#REGISTRY",
    SK: "CI#STATE",
  });
  assert.equal(calls[1]!.input.ConditionExpression, "attribute_not_exists(PK)");
  assert.equal(calls[2]!.input.ExpressionAttributeValues?.[":revision"], 1);
});
function todoContext(): CiAwsExtensionExecutionContext {
  return {
    actorId: "user-a",
    moduleId: "todo",
    tableName: stackName,
    controlTableName: "registry",
    snapshot: { revision: 7, installations: {} },
    configuration: {},
    client: db(),
    assertAccess: async () => {},
  };
}
test("To-Do queries a bounded owner partition and reconstructs pagination keys for the current actor", async () => {
  const context = todoContext();
  const calls: QueryCommand[] = [];
  const id = "1789732800000-01234567-0123-0123-0123-0123456789ab";
  mock.method(context.client, "send", async (command: QueryCommand) => {
    calls.push(command);
    return {
      Items: [],
      LastEvaluatedKey: { PK: "ignored", SK: `CI#TASK#${id}` },
    };
  });
  const first = (await ciCreateAwsTodoModule(manifest).execute(
    { action: "list" },
    context,
  )) as { nextToken: string };
  await ciCreateAwsTodoModule(manifest).execute(
    { action: "list", nextToken: first.nextToken },
    { ...context, actorId: "user-b" },
  );
  assert.equal(
    calls[0]!.input.ExpressionAttributeValues?.[":pk"],
    "CI#MODULE#todo#USER#user-a",
  );
  assert.equal(calls[0]!.input.Limit, 50);
  assert.equal(calls[0]!.input.ConsistentRead, true);
  assert.equal(
    calls[1]!.input.ExclusiveStartKey?.PK,
    "CI#MODULE#todo#USER#user-b",
  );
  await assert.rejects(
    () =>
      ciCreateAwsTodoModule(manifest).execute(
        { action: "list", nextToken: "arbitrary" },
        context,
      ),
    /continuation token/,
  );
});
test("To-Do writes atomically require the same enabled-registry revision and preserve owner isolation", async () => {
  const context = todoContext();
  let transaction: TransactWriteCommand | undefined;
  mock.method(context.client, "send", async (command: TransactWriteCommand) => {
    transaction = command;
    return {};
  });
  await ciCreateAwsTodoModule(manifest).execute(
    {
      action: "create",
      item: { title: "A task", notes: "", priority: "normal", dueDate: null },
    },
    context,
  );
  const [guard, write] = transaction!.input.TransactItems!;
  assert.equal(
    guard!.ConditionCheck!.ExpressionAttributeValues?.[":revision"],
    7,
  );
  assert.equal(write!.Put!.Item!.PK, "CI#MODULE#todo#USER#user-a");
  assert.equal(write!.Put!.ConditionExpression, "attribute_not_exists(PK)");
  await assert.rejects(() =>
    ciCreateAwsTodoModule(manifest).execute(
      {
        action: "create",
        item: {
          title: "bad",
          notes: "",
          priority: "normal",
          dueDate: "2026-02-31",
        },
      },
      context,
    ),
  );
});
test("To-Do authorization failures happen before any data access", async () => {
  const context = todoContext();
  context.assertAccess = async () => {
    throw new Error("denied");
  };
  mock.method(context.client, "send", async () => {
    throw new Error("should not access data");
  });
  await assert.rejects(
    () => ciCreateAwsTodoModule(manifest).execute({ action: "list" }, context),
    /denied/,
  );
});
function event(
  input: unknown,
  roles: string[],
  id = "actor",
): CiAppSyncResolverEvent {
  return {
    source: null,
    request: { headers: {}, domainName: null },
    info: {
      fieldName: "ManageModules",
      parentTypeName: "Mutation",
      variables: {},
      selectionSetList: [],
      selectionSetGraphQL: "",
    },
    prev: null,
    stash: {},
    arguments: { inputString: JSON.stringify(input) },
    identity: {
      sub: id,
      issuer: "test",
      claims: { sub: id, "cognito:groups": roles },
    },
  };
}
function env() {
  process.env.CI_MODULES_TABLE_NAME = "registry";
  process.env.CI_MODULES_PREFIX = prefix;
  process.env.CI_MODULES_ACCOUNT = "123456789012";
  process.env.AWS_REGION = "us-east-1";
  process.env.CI_MODULES_SERVICE_ROLE_ARN =
    "arn:aws:iam::123456789012:role/modules";
  process.env.CI_EMBERGUARD_ACCESS_TABLE = "access";
}
test("module control enforces development plus exact authenticated developer membership", async () => {
  env();
  const client = db();
  mock.method(client, "send", async () => {
    throw new Error("should not read");
  });
  const handlers = ciCreateAwsExtensionHandlers({
    framework: "next",
    definitions: [ciCreateAwsTodoModule(manifest)],
    client,
  });
  for (const [mode, roles] of [
    ["production", ["developer"]],
    ["development", ["Developer"]],
    ["development", ["system-super-admin"]],
  ] as const) {
    process.env.CI_ENV_MODE = mode;
    const result = await handlers.manage(event({ action: "list" }, [...roles]));
    assert.equal(result.ok, false);
    assert.match(String(result.body.error), /developer in development/);
  }
});
test("disabled, removed and version-mismatched modules cannot execute through direct AppSync calls", async () => {
  env();
  const client = db();
  let snapshot: CiExtensionSnapshot = {
    revision: 1,
    installations: { todo: { ...record(), status: "disabled" } },
  };
  mock.method(client, "send", async () => ({ Item: { state: snapshot } }));
  const handlers = ciCreateAwsExtensionHandlers({
    framework: "next",
    definitions: [ciCreateAwsTodoModule(manifest)],
    client,
  });
  const request = event({ id: "todo", input: { action: "list" } }, ["user"]);
  assert.equal((await handlers.execute(request)).ok, false);
  snapshot.installations.todo!.status = "enabled";
  snapshot.installations.todo!.manifest = { ...manifest, version: "2.0.0" };
  assert.equal((await handlers.execute(request)).ok, false);
  snapshot = { revision: 2, installations: {} };
  assert.equal((await handlers.execute(request)).ok, false);
});
test("module read-only restrictions use the module resource and block writes without blocking reads", async () => {
  env();
  const client = db();
  const snapshot = {
    revision: 1,
    installations: {
      todo: {
        ...record(),
        status: "enabled",
        infrastructure: {
          provider: "aws",
          id: stackId,
          outputs: { TableName: stackName },
        },
      },
    },
  };
  const definition = ciCreateAppAccessControl(
    ciExtensionAccessControl([manifest]),
    {
      roles: [
        {
          id: "auditor",
          title: "Auditor",
          precedence: 100,
          privileges: [
            {
              id: "audit-modules",
              title: "Read only",
              resource: "module-todo.*",
              action: "*",
              effect: "allow",
              scopeKinds: ["system"],
              readOnly: true,
            },
          ],
        },
      ],
    },
  );
  let writes = 0;
  mock.method(
    client,
    "send",
    async (command: GetCommand | QueryCommand | TransactWriteCommand) => {
      if (command instanceof TransactWriteCommand) {
        writes++;
        return {};
      }
      if (command instanceof GetCommand)
        return {
          Item: {
            state:
              command.input.TableName === "registry"
                ? snapshot
                : { definition },
          },
        };
      return { Items: [] };
    },
  );
  const handlers = ciCreateAwsExtensionHandlers({
    framework: "next",
    definitions: [ciCreateAwsTodoModule(manifest)],
    client,
  });
  const read = await handlers.execute(
    event({ id: "todo", input: { action: "list" } }, ["auditor"]),
  );
  assert.equal(read.ok, true);
  const write = await handlers.execute(
    event(
      {
        id: "todo",
        input: {
          action: "create",
          item: { title: "Task", notes: "", priority: "normal", dueDate: null },
        },
      },
      ["auditor"],
    ),
  );
  assert.equal(write.ok, false);
  assert.equal(writes, 0);
});
test("IAM grants are environment-scoped and retain cleanup rights after module source is removed", () => {
  const policies = ciAwsExtensionPolicies({
    prefix,
    ids: [],
    partition: "aws",
    region: "us-east-1",
    account: "123456789012",
  });
  assert.deepEqual(policies.lifecycle.resources, []);
  assert.deepEqual(policies.data.resources, []);
  assert.ok(
    policies.cleanupStacks.resources.every(
      (arn) => arn.includes(prefix) && arn !== "*",
    ),
  );
  assert.ok(
    policies.cleanupTables.resources.every((arn) => arn.includes(prefix)),
  );
});

test("client-only extensions complete their lifecycle without AWS resources", async () => {
  const client = new CloudFormationClient({ region: "us-east-1" });
  mock.method(client, "send", async () => {
    throw new Error("AWS must not be called");
  });
  const adapter = ciCreateAwsExtensionProvider({
    client,
    definitions: [{ manifest }],
    prefix,
    account: "123456789012",
    region: "us-east-1",
    partition: "aws",
    serviceRoleArn: "role",
  });
  const installation = { ...record(), infrastructure: adapter.plan(manifest) };
  await adapter.install(installation);
  assert.equal((await adapter.inspect(installation)).status, "ready");
  installation.operation = "uninstall";
  await adapter.uninstall(installation);
  assert.equal((await adapter.inspect(installation)).status, "missing");
});

test("To-Do Trash provenance is trusted, restoration preserves completion, and conflicts propagate", async () => {
  const context = todoContext();
  const item = {
    id: "1789732800000-01234567-0123-0123-0123-0123456789ab",
    title: "Done",
    notes: "",
    priority: "normal",
    dueDate: null,
    completed: true,
    deleted: false,
    revision: 2,
    createdAt: "2026-09-18T00:00:00.000Z",
    updatedAt: "2026-09-18T00:00:00.000Z",
  };
  let stored: unknown = item;
  mock.method(
    context.client,
    "send",
    async (command: GetCommand | TransactWriteCommand) => {
      if (command instanceof GetCommand) return { Item: { task: stored } };
      return {};
    },
  );
  const todo = ciCreateAwsTodoModule(manifest);
  const trashed = (await todo.execute(
    {
      action: "save",
      item: {
        ...item,
        deleted: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        deletion: {
          state: "deleted",
          operationId: "fake",
          deletedAt: "2026-01-01T00:00:00.000Z",
          deletedBy: "someone-else",
          reason: "forged",
        },
      },
    },
    context,
  )) as import("@cloudigniter/core/types").CiTodoItem;
  assert.equal(trashed.deletion?.deletedBy, "user-a");
  assert.notEqual(trashed.deletion?.operationId, "fake");
  assert.equal(trashed.createdAt, item.createdAt);
  stored = trashed;
  await assert.rejects(
    () =>
      todo.execute(
        { action: "save", item: { ...trashed, title: "Editing in trash" } },
        context,
      ),
    /Restore a task/,
  );
  const restored = (await todo.execute(
    { action: "save", item: { ...trashed, deleted: false } },
    context,
  )) as import("@cloudigniter/core/types").CiTodoItem;
  assert.equal(restored.completed, true);
  assert.equal(restored.deletion, undefined);
  mock.method(
    context.client,
    "send",
    async (command: GetCommand | TransactWriteCommand) => {
      if (command instanceof GetCommand) return { Item: { task: stored } };
      throw Object.assign(new Error("Concurrent disable or task edit"), {
        name: "TransactionCanceledException",
      });
    },
  );
  await assert.rejects(
    () =>
      todo.execute(
        { action: "save", item: { ...trashed, deleted: false } },
        context,
      ),
    /Concurrent disable/,
  );
});
