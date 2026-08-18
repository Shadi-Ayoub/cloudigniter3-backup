import assert from "node:assert/strict";
import test from "node:test";

import type { CiSecurityRoleRecord } from "@cloudigniter/core/types";
import {
  ciIsSecurityIdentifierLocked,
  ciIsSecurityIdentifierInputAllowed,
  ciUpdateSecurityEditorSessionDraft,
  type CiSecurityEditorSession,
} from "../../src/client/security/ci-security-editor-session";

const roleDraft: CiSecurityRoleRecord = {
  kind: "role",
  id: "new-role",
  title: "",
  precedence: 50,
  inherits: ["user"],
  privileges: [],
  permissionCount: 0,
  directUserCount: 0,
  inheritedUserCount: 0,
  origin: "application",
  locked: false,
};

test("keeps a create identifier unlocked after the first character", () => {
  const session: CiSecurityEditorSession = {
    mode: "create",
    draft: roleDraft,
  };

  const updated = ciUpdateSecurityEditorSessionDraft(session, {
    ...roleDraft,
    id: "a",
  });

  assert.equal(updated.mode, "create");
  assert.equal(updated.draft.id, "a");
  assert.equal(ciIsSecurityIdentifierLocked(updated), false);
});

test("keeps stable identifiers locked while editing an existing record", () => {
  const session: CiSecurityEditorSession = {
    mode: "edit",
    draft: { ...roleDraft, id: "invoice-approver" },
  };

  assert.equal(ciIsSecurityIdentifierLocked(session), true);
});

test("allows only valid intermediate lowercase kebab identifier input", () => {
  for (const value of [
    "",
    "a",
    "invoice",
    "invoice-",
    "invoice-approver",
    "reviewer2",
    "role-2",
  ]) {
    assert.equal(ciIsSecurityIdentifierInputAllowed(value), true, value);
  }

  for (const value of [
    "2role",
    "Role",
    "invoice approver",
    "invoice_approver",
    "invoice--approver",
    "invoice.",
    "-invoice",
  ]) {
    assert.equal(ciIsSecurityIdentifierInputAllowed(value), false, value);
  }
});
