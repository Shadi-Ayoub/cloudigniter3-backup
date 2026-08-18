import assert from "node:assert/strict";
import test from "node:test";

import { CI_DEFAULT_ACCESS_CONTROL_DEFINITION } from "@cloudigniter/core/lib";
import type { CiAwsEmberguardDatabase } from "@cloudigniter/emberguard/providers/aws";
import {
  GetFunctionConfigurationCommand,
  ListFunctionsCommand,
} from "@aws-sdk/client-lambda";

import {
  ciBootstrapAccessControl,
  ciCreateAccessControlEmberguard,
} from "../../src/server/backend/access-control";
import { ciResolveAccessControlBootstrapFunction } from "../../src/server/backend/access-control/ci-resolve-access-control-bootstrap-function";

test("bootstraps the canonical state from the Core default definition", async () => {
  const writes: Record<string, unknown>[] = [];
  const database: CiAwsEmberguardDatabase = {
    async readItem() {
      return { ok: true, body: { item: undefined } };
    },
    async queryItems(input) {
      assert.equal(input.ConsistentRead, true);
      return { ok: true, body: { items: [] } };
    },
    async writeItem(input) {
      writes.push(input);
      return { ok: true };
    },
    async deleteItem() {
      return { ok: true };
    },
    async transactWrite() {
      return { ok: true };
    },
  };
  const emberguard = ciCreateAccessControlEmberguard({
    database,
    accessControlTableName: "EmberguardAccess",
  });

  const result = await emberguard.ensureAccessControlState();

  assert.equal(result.created, true);
  assert.equal(result.state.definition, CI_DEFAULT_ACCESS_CONTROL_DEFINITION);
  assert.deepEqual(writes[0]?.key, {
    PK: "CI#EMBERGUARD#ACCESS_CONTROL",
    SK: "CI#DEFINITION#ACTIVE",
  });
  assert.equal(writes[0]?.existence, "insertOnly");
  assert.equal(
    (writes[0]?.item as any)?.state?.definition,
    CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
  );
});

test("invokes the deployed access-control handler instead of querying DynamoDB locally", async () => {
  let invocation: Record<string, unknown> | undefined;
  const client = {
    async send(command: { input: Record<string, unknown> }) {
      invocation = command.input;
      return {
        Payload: new TextEncoder().encode(
          JSON.stringify({
            ok: true,
            statusCode: 200,
            body: {
              created: true,
              revision: 0,
              definition: CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
              roleCounters: {},
            },
          }),
        ),
      };
    },
  };

  const result = await ciBootstrapAccessControl(
    {
      region: "us-east-1",
      bootstrapFunctionName: "get-access-control-definition",
      accessControlTableName: "EmberguardAccess",
    },
    client as any,
  );

  assert.deepEqual(result, {
    accessControlTableName: "EmberguardAccess",
    created: true,
    revision: 0,
  });
  assert.equal(invocation?.FunctionName, "get-access-control-definition");
  assert.equal(invocation?.InvocationType, "RequestResponse");
  assert.deepEqual(
    JSON.parse(new TextDecoder().decode(invocation?.Payload as Uint8Array)),
    { arguments: { inputString: "{}" } },
  );
});

test("surfaces the deployed handler error details", async () => {
  const client = {
    async send() {
      return {
        Payload: new TextEncoder().encode(
          JSON.stringify({
            ok: false,
            statusCode: 400,
            body: {
              error: "Emberguard access operation failed.",
              details: { message: "DynamoDB access was denied." },
            },
          }),
        ),
      };
    },
  };

  await assert.rejects(
    ciBootstrapAccessControl(
      {
        region: "us-east-1",
        bootstrapFunctionName: "get-access-control-definition",
        accessControlTableName: "EmberguardAccess",
      },
      client as any,
    ),
    /DynamoDB access was denied/,
  );
});

test("accepts a deployed handler response without optional bootstrap metadata", async () => {
  const client = {
    async send() {
      return {
        Payload: new TextEncoder().encode(
          JSON.stringify({
            ok: true,
            statusCode: 200,
            body: {
              definition: CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
              roleCounters: {},
            },
          }),
        ),
      };
    },
  };

  assert.deepEqual(
    await ciBootstrapAccessControl(
      {
        region: "us-east-1",
        bootstrapFunctionName: "get-access-control-definition",
        accessControlTableName: "EmberguardAccess",
      },
      client as any,
    ),
    {
      accessControlTableName: "EmberguardAccess",
      created: false,
    },
  );
});

test("discovers the bootstrap handler by its exact access-table binding", async () => {
  let listPage = 0;
  const inspected: string[] = [];
  const client = {
    async send(command: unknown) {
      if (command instanceof ListFunctionsCommand) {
        listPage += 1;
        return listPage === 1
          ? {
              Functions: [
                { FunctionName: "unrelated-handler" },
                {
                  FunctionName:
                    "amplify-other-getemberguarddefinitionhandler-123",
                },
              ],
              NextMarker: "next",
            }
          : {
              Functions: [
                {
                  FunctionName:
                    "amplify-app-getemberguarddefinitionhandler-456",
                },
              ],
            };
      }
      if (command instanceof GetFunctionConfigurationCommand) {
        const functionName = command.input.FunctionName ?? "";
        inspected.push(functionName);
        return {
          Environment: {
            Variables: {
              CI_EMBERGUARD_ACCESS_TABLE: functionName.includes("app-")
                ? "EmberguardAccess-current"
                : "EmberguardAccess-other",
            },
          },
        };
      }
      throw new Error("Unexpected Lambda command.");
    },
  };

  assert.equal(
    await ciResolveAccessControlBootstrapFunction({
      accessControlTableName: "EmberguardAccess-current",
      client: client as any,
    }),
    "amplify-app-getemberguarddefinitionhandler-456",
  );
  assert.equal(listPage, 2);
  assert.deepEqual(inspected, [
    "amplify-other-getemberguarddefinitionhandler-123",
    "amplify-app-getemberguarddefinitionhandler-456",
  ]);
});

test("rejects ambiguous access-control bootstrap handlers", async () => {
  const client = {
    async send(command: unknown) {
      if (command instanceof ListFunctionsCommand) {
        return {
          Functions: [
            { FunctionName: "getemberguarddefinition-one" },
            { FunctionName: "getemberguarddefinition-two" },
          ],
        };
      }
      if (command instanceof GetFunctionConfigurationCommand) {
        return {
          Environment: {
            Variables: {
              CI_EMBERGUARD_ACCESS_TABLE: "EmberguardAccess-current",
            },
          },
        };
      }
      throw new Error("Unexpected Lambda command.");
    },
  };

  await assert.rejects(
    ciResolveAccessControlBootstrapFunction({
      accessControlTableName: "EmberguardAccess-current",
      client: client as any,
    }),
    /More than one deployed handler/,
  );
});
