import assert from "node:assert/strict";
import test from "node:test";

import { ciResolveIcon } from "@ci-core/lib";

test("resolves the built-in security dashboard icons", () => {
  assert.deepEqual(
    [
      "ci:badge-account-outline",
      "ci:key-outline",
      "ci:account-key-outline",
      "ci:shape-outline",
      "ci:account-multiple-check-outline",
    ].map((icon) => ciResolveIcon(icon)),
    [
      "mdi:badge-account-outline",
      "mdi:key-outline",
      "mdi:account-key-outline",
      "mdi:shape-outline",
      "mdi:account-multiple-check-outline",
    ],
  );
});

test("returns null for an unregistered built-in icon", () => {
  assert.equal(ciResolveIcon("ci:not-registered"), null);
});
