import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { createElement, type ReactNode } from "react";

import { CiUserManagementPage } from "../src/client/user-management/CiUserManagementPage";
import { SidebarMenuSkeleton } from "../src/client/components/shadcn/sidebar";

const require = createRequire(import.meta.url);
const { renderToStaticMarkup } = require("react-dom/server") as {
  renderToStaticMarkup(node: ReactNode): string;
};

const user = {
  id: "user-1",
  username: "shadi_ayoub@yahoo.com",
  email: "shadi_ayoub@yahoo.com",
  emailVerified: true,
  givenName: "Shadi",
  familyName: "Ayoub",
  displayName: "Shadi Ayoub",
  status: "active" as const,
  identityProvider: {
    id: "amazon-cognito",
    label: "Amazon Cognito",
    kind: "native" as const,
  },
  primaryRole: "admin",
  roles: ["admin", "developer"],
  assignments: [
    {
      id: "assignment-1",
      subjectId: "user-1",
      roleId: "admin",
      scope: { kind: "system" as const },
      propagation: "exact" as const,
    },
  ],
  createdAt: "2026-08-02T13:16:00.000Z",
  detailLevel: "summary" as const,
};

function renderUserManagementPage(
  managementKind: "users" | "administrators" = "users",
  mode: "active" | "trash" = "active",
  includeUser = true,
): string {
  return renderToStaticMarkup(
    createElement(CiUserManagementPage, {
      managementKind,
      mode,
      users: includeUser ? [user] : [],
      providerLabel: "Amazon Cognito",
      roleOptions: [
        { id: "admin", label: "Administrator" },
        { id: "developer", label: "Developer" },
      ],
      localeOptions: [{ value: "en-US", label: "English" }],
      timeZoneOptions: [{ value: "Asia/Dubai", label: "Asia / Dubai" }],
      locale: "en-US",
      capabilities: {
        canCreate: true,
        canUpdate: true,
        canDelete: true,
        canAssignRoles: true,
        canEmail: true,
        canImpersonate: false,
      },
      developmentSeeder: {
        id: "test-users",
        title: "Test users",
        onSeed: async () => ({
          ok: true,
          operation: "seed" as const,
          seederId: "test-users",
          created: 0,
          deleted: 0,
          failed: 0,
          skipped: 0,
          items: [],
        }),
        onCleanup: async () => ({
          ok: true,
          operation: "cleanup" as const,
          seederId: "test-users",
          created: 0,
          deleted: 0,
          failed: 0,
          skipped: 0,
          items: [],
        }),
      },
    }),
  );
}

test("renders deterministic user-management summary controls", () => {
  const firstMarkup = renderUserManagementPage();
  const secondMarkup = renderUserManagementPage();

  assert.equal(firstMarkup, secondMarkup);
  assert.match(firstMarkup, /Identity provider · Amazon Cognito/);
  assert.match(firstMarkup, /lucide-cloud/);
  assert.match(firstMarkup, /lucide-user-round/);
  assert.match(firstMarkup, />2 roles</);
  assert.match(firstMarkup, />1 assignment</);
  assert.match(firstMarkup, /aria-label="Status"/);
  assert.match(firstMarkup, /aria-label="Role"/);
  assert.equal(firstMarkup.match(/>Seeder</g)?.length, 1);
  assert.equal(firstMarkup.match(/Amazon Cognito/g)?.length, 1);
  assert.doesNotMatch(firstMarkup, /Management enabled/);
  assert.match(firstMarkup, /Aug 2, 2026, 1:16 PM/);
});

test("keeps sidebar skeleton markup deterministic", () => {
  const firstMarkup = renderToStaticMarkup(
    createElement(SidebarMenuSkeleton, { showIcon: true }),
  );
  const secondMarkup = renderToStaticMarkup(
    createElement(SidebarMenuSkeleton, { showIcon: true }),
  );

  assert.equal(firstMarkup, secondMarkup);
  assert.match(firstMarkup, /--skeleton-width:70%/);
});

test("labels the administrator lifecycle table independently", () => {
  const markup = renderUserManagementPage("administrators", "trash", false);

  assert.match(markup, /<h1[^>]*>Deleted administrators<\/h1>/);
  assert.match(markup, />Administrator lifecycle<\/div>/);
  assert.match(markup, /No deleted administrator accounts were found\./);
});
