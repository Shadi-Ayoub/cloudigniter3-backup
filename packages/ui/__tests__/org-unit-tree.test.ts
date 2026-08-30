import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { createElement, type ReactNode } from "react";
import {
  CiOrgUnitManagementPage,
  ciApplyOrgUnitMutation,
  ciGetAvailableOrgUnitTenantOptions,
  ciResolveOrgUnitDropDestination,
} from "../src/client/org-unit-management/CiOrgUnitManagementPage";

const require = createRequire(import.meta.url);
const { renderToStaticMarkup } = require("react-dom/server") as {
  renderToStaticMarkup(node: ReactNode): string;
};

test("renders shared Org Units through the direction-aware tree explorer", () => {
  const markup = renderToStaticMarkup(
    createElement(CiOrgUnitManagementPage, {
      canManage: true,
      direction: "rtl" as const,
      locale: "en-GB",
      tenants: [
        {
          tenantId: "tenant-a",
          name: "Company A",
          slug: "company-a",
          status: "suspended",
          type: "company",
          region: "global",
          createdAt: "2026-08-29T10:00:00.000Z",
        },
        {
          tenantId: "tenant-b",
          name: "Company B",
          slug: "company-b",
          status: "active",
          type: "company",
          region: "global",
          createdAt: "2026-08-29T10:00:00.000Z",
        },
      ],
      orgUnits: [
        {
          orgUnitId: "hq",
          parentId: null,
          ancestorOrgUnitIds: [],
          name: "Central HQ",
          slug: "central-hq",
          path: "/central-hq",
          status: "active",
          tenantIds: ["tenant-a", "tenant-b"],
          childIds: ["finance"],
          createdAt: "2026-08-29T10:00:00.000Z",
          updatedAt: "2026-08-29T10:00:00.000Z",
          version: 1,
        },
        {
          orgUnitId: "finance",
          parentId: "hq",
          ancestorOrgUnitIds: ["hq"],
          name: "Finance",
          slug: "finance",
          path: "/central-hq/finance",
          status: "suspended",
          tenantIds: ["tenant-a", "tenant-b"],
          childIds: [],
          createdAt: "2026-08-29T10:00:00.000Z",
          updatedAt: "2026-08-29T10:00:00.000Z",
          version: 1,
        },
      ],
      developmentSeeder: {
        id: "test-tenants",
        title: "Test tenants and Org Units",
        onSeed: async () => ({
          ok: true,
          seederId: "test-tenants",
          operation: "seed" as const,
          created: 0,
          deleted: 0,
          skipped: 0,
          failed: 0,
          items: [],
          resources: [],
          orgUnits: [],
        }),
        onCleanup: async () => ({
          ok: true,
          seederId: "test-tenants",
          operation: "cleanup" as const,
          created: 0,
          deleted: 0,
          skipped: 0,
          failed: 0,
          items: [],
          resources: [],
          orgUnits: [],
        }),
      },
    }),
  );

  assert.match(markup, /Org Unit management/);
  assert.match(markup, /2 Org Units/);
  assert.match(markup, /2 shared/);
  assert.match(markup, /dir="rtl"/);
  assert.match(markup, /aria-label="Org Unit hierarchy"/);
  assert.match(markup, /role="treeitem"/);
  assert.match(markup, /aria-label="Resize Org Unit tree panel"/);
  assert.match(markup, /aria-label="Focused Org Unit information"/);
  assert.match(markup, /aria-label="Collapse Central HQ"/);
  assert.match(markup, /aria-label="Actions for Central HQ"/);
  assert.match(markup, /data-status="suspended"/);
  assert.match(markup, /bg-danger-surface-foreground/);
  assert.match(markup, /lucide-git-fork/);
  assert.doesNotMatch(markup, /lucide-folder/);
  assert.match(markup, /aria-label="Move Central HQ"/);
  assert.match(markup, /aria-label="Org Unit tree root drop target"/);
  assert.match(markup, /data-org-unit-drop-target="hq"/);
  assert.match(markup, /touch-none cursor-grab/);
  assert.doesNotMatch(markup, /draggable="true"/);
  assert.match(markup, /Predecessor path/);
  assert.match(markup, /Tenant attachments/);
  assert.match(markup, /29 Aug 2026, 10:00/);
  assert.match(markup, /New root<\/button>/);
  assert.match(markup, /Seeder<\/button>/);
  assert.doesNotMatch(markup, /<table/);
});

test("applies a moved root and descendant ancestry to the local explorer", () => {
  const base = {
    name: "Org Unit",
    slug: "unit",
    description: undefined,
    status: "active" as const,
    tenantIds: ["tenant-a"],
    childIds: [] as string[],
    createdAt: "2026-08-29T10:00:00.000Z",
    updatedAt: "2026-08-29T10:00:00.000Z",
    version: 1,
  };
  const oldParent = {
    ...base,
    orgUnitId: "old-root",
    parentId: null,
    ancestorOrgUnitIds: [],
    path: "/old-root",
    childIds: ["finance"],
  };
  const target = {
    ...base,
    orgUnitId: "target",
    parentId: null,
    ancestorOrgUnitIds: [],
    path: "/target",
  };
  const before = {
    ...base,
    orgUnitId: "finance",
    parentId: "old-root",
    ancestorOrgUnitIds: ["old-root"],
    path: "/old-root/finance",
    childIds: ["payroll"],
  };
  const leaf = {
    ...base,
    orgUnitId: "payroll",
    parentId: "finance",
    ancestorOrgUnitIds: ["old-root", "finance"],
    path: "/old-root/finance/payroll",
  };
  const saved = {
    ...before,
    parentId: "target",
    ancestorOrgUnitIds: ["target"],
    path: "/target/finance",
    updatedAt: "2026-08-30T10:00:00.000Z",
    version: 2,
  };

  const moved = ciApplyOrgUnitMutation(
    [oldParent, target, before, leaf],
    before,
    saved,
  );
  const byId = new Map(moved.map((row) => [row.orgUnitId, row]));
  assert.deepEqual(byId.get("old-root")?.childIds, []);
  assert.deepEqual(byId.get("target")?.childIds, ["finance"]);
  assert.equal(byId.get("payroll")?.path, "/target/finance/payroll");
  assert.deepEqual(byId.get("payroll")?.ancestorOrgUnitIds, [
    "target",
    "finance",
  ]);
});

test("resolves a pointer drop to another Org Unit", () => {
  const base = {
    parentId: null,
    ancestorOrgUnitIds: [] as string[],
    slug: "unit",
    path: "/unit",
    status: "active" as const,
    tenantIds: ["tenant-a"],
    childIds: [] as string[],
    createdAt: "2026-08-29T10:00:00.000Z",
    updatedAt: "2026-08-29T10:00:00.000Z",
    version: 1,
  };
  const source = { ...base, orgUnitId: "finance", name: "Finance" };
  const target = { ...base, orgUnitId: "hq", name: "Headquarters" };

  const intent = ciResolveOrgUnitDropDestination(
    [source, target],
    source.orgUnitId,
    target.orgUnitId,
  );

  assert.equal(intent?.row.orgUnitId, "finance");
  assert.equal(intent?.newParent?.orgUnitId, "hq");
  assert.equal(
    ciResolveOrgUnitDropDestination([source, target], "missing", "hq"),
    null,
  );
});

test("offers only unselected tenants inherited from the direct parent", () => {
  const tenants = [
    {
      tenantId: "tenant-a",
      name: "Company A",
      slug: "company-a",
      status: "active" as const,
      type: "company",
      region: "global",
      createdAt: "2026-08-29T10:00:00.000Z",
    },
    {
      tenantId: "tenant-b",
      name: "Company B",
      slug: "company-b",
      status: "active" as const,
      type: "company",
      region: "global",
      createdAt: "2026-08-29T10:00:00.000Z",
    },
    {
      tenantId: "tenant-c",
      name: "Unavailable Company",
      slug: "unavailable-company",
      status: "active" as const,
      type: "company",
      region: "global",
      createdAt: "2026-08-29T10:00:00.000Z",
    },
  ];

  const options = ciGetAvailableOrgUnitTenantOptions(
    tenants,
    ["tenant-a", "tenant-b"],
    ["tenant-a"],
  );

  assert.deepEqual(
    options.map((option) => option.id),
    ["tenant-b"],
  );
});
