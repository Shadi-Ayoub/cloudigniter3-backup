import assert from "node:assert/strict";
import test from "node:test";
import { ciGetNextAwsSettingsAccess } from "../../src/server/settings/ci-get-next-aws-settings-access";

test("Settings access preserves allowed capabilities and supports older read/update responses", async () => {
  assert.deepEqual(
    await ciGetNextAwsSettingsAccess(async () => ({
      data: { read: true, update: false },
    })),
    {
      ok: true,
      statusCode: 200,
      body: { read: true, update: false, enforce: false, overwrite: false },
    },
  );
  const result = await ciGetNextAwsSettingsAccess(async () => ({
    data: JSON.stringify({
      ok: true,
      statusCode: 200,
      body: { read: true, update: true, enforce: true, overwrite: true },
    }),
  }));
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.body.enforce, true);
});

test("denied capabilities and explicit authorization responses are friendly non-retryable results", async () => {
  for (const response of [
    { data: { read: false, update: false } },
    {
      data: {
        ok: false,
        statusCode: 403,
        body: { error: "Internal permission detail" },
      },
    },
    {
      data: null,
      errors: [
        {
          message: "Not Authorized to access GetSettings on type Query",
          errorType: "Unauthorized",
        },
      ],
    },
    {
      data: null,
      errors: [{ message: "Access denied", extensions: { code: "FORBIDDEN" } }],
    },
  ]) {
    const result = await ciGetNextAwsSettingsAccess(async () => response);
    assert.equal(result.ok, false);
    if (result.ok) assert.fail("Expected denied access");
    assert.equal(result.statusCode, 403);
    assert.equal(result.body.errorMeta?.title, "Settings access restricted");
    assert.equal(result.body.errorMeta?.showRetry, false);
    assert.match(result.body.error, /Ask a system administrator/);
    assert.doesNotMatch(
      JSON.stringify(result),
      /GetSettings|Internal permission detail/,
    );
  }
});

test("unverified or malformed responses remain unavailable rather than claiming access is denied", async () => {
  for (const response of [
    { data: null },
    { data: "not JSON" },
    { data: [] },
    { data: { read: "true", update: true } },
    { data: { read: true, update: true, enforce: "true" } },
    {
      data: {
        ok: false,
        statusCode: 400,
        body: { error: "CI_PRIVATE_SETTINGS_TABLE stack path" },
      },
    },
    {
      data: null,
      errors: [{ message: "Resolver failure", errorType: "Lambda:Unhandled" }],
    },
  ]) {
    const result = await ciGetNextAwsSettingsAccess(async () => response);
    assert.equal(result.ok, false);
    if (result.ok) assert.fail("Expected verification failure");
    assert.equal(result.statusCode, 500);
    assert.equal(result.body.errorMeta?.showRetry, true);
    assert.match(result.body.errorMeta?.title ?? "", /temporarily unavailable/);
    assert.doesNotMatch(
      JSON.stringify(result),
      /CI_PRIVATE_SETTINGS_TABLE|Lambda|Resolver failure/,
    );
  }
  const network = await ciGetNextAwsSettingsAccess(async () => {
    throw new Error("Sensitive service URL");
  });
  assert.equal(network.ok, false);
  assert.doesNotMatch(JSON.stringify(network), /Sensitive/);
});

test("expired sessions offer sign-in recovery without retrying authorization", async () => {
  const result = await ciGetNextAwsSettingsAccess(async () => ({
    data: { ok: false, statusCode: 401, body: {} },
  }));
  assert.equal(result.ok, false);
  if (result.ok) assert.fail("Expected sign-in failure");
  assert.equal(result.statusCode, 401);
  assert.equal(result.body.errorMeta?.title, "Please sign in again");
  assert.equal(result.body.errorMeta?.showRetry, false);
});
