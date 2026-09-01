import assert from "node:assert/strict";
import test from "node:test";
import {
  ciDeserializeAwsJson,
  ciSerializeAwsJson,
  ciSerializeUserProfileAwsJsonFields,
} from "../../src/lib";

test("serializes structured values for AppSync AWSJSON variables", () => {
  const address = { locality: "Dubai", countryCode: "AE" };
  const extensions = { cloudigniterSeeder: "test-users" };

  assert.equal(ciSerializeAwsJson(address), JSON.stringify(address));
  assert.equal(ciSerializeAwsJson(extensions), JSON.stringify(extensions));
});

test("rejects values that cannot be represented as JSON", () => {
  assert.throws(
    () => ciSerializeAwsJson(undefined),
    /must be JSON-serializable/,
  );

  const cyclic: Record<string, unknown> = {};
  cyclic.self = cyclic;
  assert.throws(() => ciSerializeAwsJson(cyclic), /must be JSON-serializable/);
});

test("decodes AWSJSON strings and preserves already-decoded values", () => {
  const value = { locality: "Dubai", countryCode: "AE" };

  assert.deepEqual(ciDeserializeAwsJson(JSON.stringify(value)), value);
  assert.equal(ciDeserializeAwsJson(value), value);
  assert.equal(ciDeserializeAwsJson(null), null);
  assert.throws(
    () => ciDeserializeAwsJson("not-json"),
    /must contain valid JSON/,
  );
});

test("encodes every UserProfile AWSJSON mutation field exactly once", () => {
  const address = { locality: "Dubai", countryCode: "AE" };
  const extensions = { cloudigniterSeeder: "test-users" };
  const statusChange = {
    changedAt: "2026-09-01T00:00:00.000Z",
    changedBy: "root-user",
    reason: "Suspend disposable account",
  };
  const deletion = {
    state: "deleted",
    operationId: "operation-1",
    deletedAt: "2026-09-01T00:01:00.000Z",
    deletedBy: "root-user",
    reason: "Remove disposable account",
  };
  const input = ciSerializeUserProfileAwsJsonFields({
    userId: "user-1",
    address,
    extensions,
    statusChange,
    deletion,
  });

  assert.deepEqual(JSON.parse(input.address ?? ""), address);
  assert.deepEqual(JSON.parse(input.extensions ?? ""), extensions);
  assert.deepEqual(JSON.parse(input.statusChange ?? ""), statusChange);
  assert.deepEqual(JSON.parse(input.deletion ?? ""), deletion);
  assert.equal(input.userId, "user-1");

  const restore = ciSerializeUserProfileAwsJsonFields({
    userId: "user-1",
    deletion: null,
  });
  assert.equal(restore.deletion, null);

  const omitted = ciSerializeUserProfileAwsJsonFields({
    userId: "user-2",
    address: undefined,
  });
  assert.equal(Object.hasOwn(omitted, "address"), false);
});
