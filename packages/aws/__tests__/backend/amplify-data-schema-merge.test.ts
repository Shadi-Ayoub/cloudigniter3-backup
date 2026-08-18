import assert from "node:assert/strict";
import test from "node:test";

import { ciMergeAmplifyDataSchemas } from "@ci-aws/server/backend";

test("merges independently owned Amplify schema fragments", () => {
  const coreModel = { kind: "core" };
  const customModel = { kind: "custom" };

  assert.deepEqual(
    ciMergeAmplifyDataSchemas(
      { CoreModel: coreModel },
      {},
      { CustomModel: customModel },
    ),
    { CoreModel: coreModel, CustomModel: customModel },
  );
});

test("rejects a custom schema name that collides with core", () => {
  assert.throws(
    () =>
      ciMergeAmplifyDataSchemas(
        { Book: { owner: "core" } },
        { Book: { owner: "application" } },
      ),
    /Amplify Data schema name collision: "Book"/,
  );
});
