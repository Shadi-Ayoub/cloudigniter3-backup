import assert from "node:assert/strict";
import test from "node:test";

import { ciFormatDateTime } from "../src/lib/ci-format-date-time";
import { ciFormatTenantDate } from "../src/client/tenant-management/ci-format-tenant-date";

test("formats tenant timestamps with deterministic SSR settings", () => {
  assert.equal(
    ciFormatTenantDate("2026-08-29T23:56:00.000-04:00"),
    "Aug 30, 2026, 3:56 AM",
  );
});

test("preserves missing and invalid tenant timestamp fallbacks", () => {
  assert.equal(ciFormatTenantDate(undefined), "—");
  assert.equal(ciFormatTenantDate("not-a-date"), "not-a-date");
});

test("formats timestamps with an explicit locale and stable UTC timezone", () => {
  assert.equal(
    ciFormatDateTime("2026-08-29T22:33:30.000Z", "en-GB"),
    "29 Aug 2026, 22:33",
  );
});
