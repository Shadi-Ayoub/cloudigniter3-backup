import assert from "node:assert/strict";
import test from "node:test";

import { transactWrite } from "../../src/lib/dynamodb/class/ci-transact-dynamodb-write";

test("forwards optimistic put conditions through TransactWriteItems", async () => {
  let commandInput: Record<string, any> | undefined;
  const client = {
    async send(command: { input: Record<string, any> }) {
      commandInput = command.input;
      return { $metadata: {} };
    },
  };

  const result = await transactWrite(client as never, {
    tableName: "EmberguardAccess",
    items: [
      {
        mode: "put",
        key: { PK: "CI#EMBERGUARD#ACCESS_CONTROL", SK: "CI#DEFINITION#ACTIVE" },
        item: { state: { revision: 4 } },
        condition: {
          expression: "#state.#revision = :expectedRevision",
          names: { "#state": "state", "#revision": "revision" },
          values: { ":expectedRevision": 3 },
        },
      },
    ],
  });

  assert.equal(result.ok, true);
  const put = commandInput?.TransactItems?.[0]?.Put;
  assert.equal(
    put?.ConditionExpression,
    "(#state.#revision = :expectedRevision)"
  );
  assert.deepEqual(put?.ExpressionAttributeNames, {
    "#state": "state",
    "#revision": "revision",
  });
  assert.deepEqual(put?.ExpressionAttributeValues, {
    ":expectedRevision": 3,
  });
});
