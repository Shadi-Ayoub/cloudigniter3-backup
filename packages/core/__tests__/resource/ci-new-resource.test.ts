import assert from "node:assert/strict";
import test from "node:test";

import {
  CI_DEFAULT_NEW_RESOURCE_BADGE_DURATION_MS,
  ciIsNewResource,
} from "../../src/lib/resource";

test("uses the shared five-minute NEW-resource window", () => {
  assert.equal(CI_DEFAULT_NEW_RESOURCE_BADGE_DURATION_MS, 300_000);

  const now = Date.parse("2026-08-30T12:00:00.000Z");
  assert.equal(
    ciIsNewResource("2026-08-30T11:59:00.000Z", { now }),
    true,
  );
  assert.equal(
    ciIsNewResource("2026-08-30T11:55:00.000Z", { now }),
    false,
  );
});

test("rejects invalid, future, and disabled recency windows", () => {
  const now = Date.parse("2026-08-30T12:00:00.000Z");
  assert.equal(ciIsNewResource("invalid", { now }), false);
  assert.equal(ciIsNewResource("2026-08-30T12:00:01.000Z", { now }), false);
  assert.equal(
    ciIsNewResource("2026-08-30T11:59:59.000Z", {
      now,
      durationMs: 0,
    }),
    false,
  );
});
