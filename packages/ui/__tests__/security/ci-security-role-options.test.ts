import assert from "node:assert/strict";
import test from "node:test";

import {
  ciGetAvailableInheritedRoleOptions,
  ciSecurityRoleInherits,
} from "../../src/client/security/ci-security-role-options";

const roles = [
  { id: "user", inherits: [] },
  { id: "admin", inherits: ["user"] },
  { id: "super-admin", inherits: ["admin"] },
  { id: "system-admin", inherits: ["user"] },
  { id: "system-super-admin", inherits: ["system-admin"] },
] as const;

test("detects direct and transitive inheritance", () => {
  assert.equal(ciSecurityRoleInherits("admin", "user", roles), true);
  assert.equal(ciSecurityRoleInherits("super-admin", "user", roles), true);
  assert.equal(ciSecurityRoleInherits("system-admin", "admin", roles), false);
});

test("excludes selected, self, and cycle-causing inheritance options", () => {
  const available = ciGetAvailableInheritedRoleOptions(
    "admin",
    ["user"],
    roles
  ).map((role) => role.id);

  assert.deepEqual(available, ["system-admin", "system-super-admin"]);
  assert.equal(available.includes("admin"), false);
  assert.equal(available.includes("super-admin"), false);
});

test("does not expand a direct selection into its inherited roles", () => {
  const selected = ["super-admin"];
  const available = ciGetAvailableInheritedRoleOptions(
    "application-manager",
    selected,
    roles
  ).map((role) => role.id);

  assert.deepEqual(selected, ["super-admin"]);
  assert.equal(available.includes("admin"), true);
  assert.equal(available.includes("user"), true);
});
