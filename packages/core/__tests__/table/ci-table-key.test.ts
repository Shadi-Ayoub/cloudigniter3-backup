import assert from "node:assert/strict";
import test from "node:test";

import {
  CI_TABLE_KEY_DELIMITER,
  CI_TABLE_KEY_PREFIX,
} from "../../src/lib/table/ci-build-table-key";
import { ciBuildTableKey, ciBuildTableKeys } from "../../src/lib/table";

test("builds CloudIgniter-prefixed table key values", () => {
  assert.equal(CI_TABLE_KEY_PREFIX, "CI");
  assert.equal(CI_TABLE_KEY_DELIMITER, "#");
  assert.equal(
    ciBuildTableKey("TENANT", "tenant-alpha", "USER_PROFILE", "User-123"),
    "CI#TENANT#tenant-alpha#USER_PROFILE#User-123",
  );
});

test("builds a canonical PK and SK pair", () => {
  assert.deepEqual(
    ciBuildTableKeys({
      partition: ["EMBERGUARD", "ACCESS_CONTROL"],
      sort: ["DEFINITION", "ACTIVE"],
    }),
    {
      PK: "CI#EMBERGUARD#ACCESS_CONTROL",
      SK: "CI#DEFINITION#ACTIVE",
    },
  );
});

test("rejects ambiguous table key segments", () => {
  assert.throws(
    () => ciBuildTableKey(...([] as unknown as [string, ...string[]])),
    /requires at least one segment/,
  );
  assert.throws(() => ciBuildTableKey(""), /non-empty string/);
  assert.throws(() => ciBuildTableKey(" TENANT"), /surrounding whitespace/);
  assert.throws(() => ciBuildTableKey("TENANT#tenant-alpha"), /must not contain/);
});
