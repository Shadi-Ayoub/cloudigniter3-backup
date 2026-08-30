import assert from "node:assert/strict";
import test from "node:test";

import {
  ciCanAccessDeveloperTools,
  ciCanAccessDevBeacon,
} from "../../src/lib/index";

const developer = {
  authenticated: true,
  roles: ["developer"],
} as const;

test("developer tools require development mode, authentication, and exact developer membership", () => {
  assert.equal(
    ciCanAccessDeveloperTools({ envMode: "development", actor: developer }),
    true,
  );
  assert.equal(
    ciCanAccessDeveloperTools({
      envMode: "development",
      actor: { authenticated: false, roles: ["developer"] },
    }),
    false,
  );
  assert.equal(
    ciCanAccessDeveloperTools({
      envMode: "development",
      actor: { authenticated: true, roles: ["DEVELOPER"] },
    }),
    false,
  );
  assert.equal(
    ciCanAccessDeveloperTools({ envMode: "test", actor: developer }),
    false,
  );
  assert.equal(
    ciCanAccessDeveloperTools({ envMode: "production", actor: developer }),
    false,
  );
});

test("developer tools fail closed when disabled or configured without roles", () => {
  assert.equal(
    ciCanAccessDeveloperTools({
      envMode: "development",
      actor: developer,
      options: { enabled: false },
    }),
    false,
  );
  assert.equal(
    ciCanAccessDeveloperTools({
      envMode: "development",
      actor: developer,
      options: { requiredRoles: [] },
    }),
    false,
  );
});

test("Dev Beacon uses the shared strict developer-tools gate", () => {
  assert.equal(
    ciCanAccessDevBeacon({
      envMode: "development",
      actor: developer,
      options: { enabled: true },
    }),
    true,
  );
  assert.equal(
    ciCanAccessDevBeacon({
      envMode: "development",
      actor: { authenticated: false, roles: [] },
      options: { enabled: true },
    }),
    false,
  );
  assert.equal(
    ciCanAccessDevBeacon({
      envMode: "production",
      actor: developer,
      options: { enabled: true, allowProduction: true },
    }),
    false,
  );
});
