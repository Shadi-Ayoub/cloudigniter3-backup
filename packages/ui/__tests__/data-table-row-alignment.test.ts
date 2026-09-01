import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { createElement, type ReactNode } from "react";

import { CI_DATA_TABLE_DEFAULT_ROW_ACTION_OVERFLOW } from "@cloudigniter/core/lib";

import { CiDataTable } from "../src/client/components/data-table/components/CiDataTable";
import { CiSearchableChipMultiSelect } from "../src/client/components/searchable-chip-multi-select";
import { ciResolveDataTableInitialSorting } from "../src/client/components/data-table/lib/ci-data-table-sorting";
import { CiTenantManagementPage } from "../src/client/tenant-management/CiTenantManagementPage";

const require = createRequire(import.meta.url);
const { renderToStaticMarkup } = require("react-dom/server") as {
  renderToStaticMarkup(node: ReactNode): string;
};

test("centers every table body cell on the same row axis", () => {
  const markup = renderToStaticMarkup(
    createElement(CiDataTable, {
      columns: [{ accessorKey: "name", header: "Tenant" }],
      data: [{ name: "Deleted tenant" }],
      rowActions: [
        {
          id: "restore",
          label: "Restore",
          display: "icon",
          icon: createElement("svg", { "aria-hidden": true }),
          onSelect: () => undefined,
        },
      ],
      config: {
        excelExport: false,
        pagination: { enabled: false },
      },
    }),
  );
  const tableBody = markup.slice(
    markup.indexOf("<tbody"),
    markup.indexOf("</tbody>"),
  );
  const rowClassName = tableBody.match(/<tr[^>]*class="([^"]+)"/)?.[1];
  const cellClassNames = [
    ...tableBody.matchAll(/<td[^>]*class="([^"]+)"/g),
  ].map((match) => match[1] ?? "");

  assert.match(rowClassName ?? "", /\bitems-stretch\b/);
  assert.equal(cellClassNames.length, 2);
  for (const className of cellClassNames) {
    assert.match(className, /\bflex\b/);
    assert.match(className, /\bitems-center\b/);
  }
  assert.match(cellClassNames.at(-1) ?? "", /\bjustify-end\b/);
});

test("renders an overflow action menu for manageable active tenants", () => {
  const markup = renderToStaticMarkup(
    createElement(CiTenantManagementPage, {
      mode: "active",
      tenants: [
        {
          tenantId: "tenant-a",
          name: "Tenant A",
          slug: "tenant-a",
          status: "active",
          type: "tenant",
          region: "global",
          createdAt: "2026-08-29T10:00:00.000Z",
        },
        {
          tenantId: "tenant-b",
          name: "Tenant B",
          slug: "tenant-b",
          status: "suspended",
          type: "tenant",
          region: "global",
          createdAt: "2026-08-29T11:00:00.000Z",
        },
      ],
      capabilities: {
        canDelete: true,
        canSetStatus: true,
        canRestore: false,
        canPurge: false,
      },
      onDelete: async () => ({ ok: true, message: "Deleted" }),
      onSetStatus: async () => ({ ok: true, message: "Suspended" }),
    }),
  );

  assert.match(markup, /<h1[^>]*>Tenants<\/h1>/);
  assert.match(markup, />Tenant management<\/div>/);
  assert.match(
    markup,
    /Review tenant details, manage operational status, and coordinate tenant administration across the platform\./,
  );
  assert.doesNotMatch(markup, /move tenants to Trash/);
  assert.match(markup, />2 records<\/span>/);
  assert.doesNotMatch(markup, />Management enabled<\/span>/);
  assert.match(markup, /lucide-building-2/);
  assert.match(markup, /\[&amp;&gt;svg\]:size-16/);
  assert.match(
    markup,
    /border-success-border bg-success-surface text-success-surface-foreground[^>]*>Active<\/span>/,
  );
  assert.match(
    markup,
    /border-danger-border bg-danger-surface text-danger-surface-foreground[^>]*>Suspended<\/span>/,
  );
  assert.match(markup, /class="[^"]*\bw-full\b[^"]*" style="width:100%"/);
  assert.match(markup, /aria-label="Delete"/);
  assert.doesNotMatch(markup, />Delete</);
  assert.match(markup, /aria-label="Actions"/);
});

test("uses the Core overflow default and keeps inline icon actions label-free", () => {
  assert.equal(CI_DATA_TABLE_DEFAULT_ROW_ACTION_OVERFLOW, 1);

  const markup = renderToStaticMarkup(
    createElement(CiDataTable, {
      columns: [{ accessorKey: "name", header: "Tenant" }],
      data: [{ name: "Tenant A" }],
      rowActions: [
        {
          id: "edit",
          label: "Edit tenant",
          icon: createElement("svg", { "aria-hidden": true }),
          onSelect: () => undefined,
        },
        {
          id: "delete",
          label: "Delete tenant",
          icon: createElement("svg", { "aria-hidden": true }),
          onSelect: () => undefined,
        },
      ],
      config: {
        excelExport: false,
        pagination: { enabled: false },
        rowActions: { mode: "mixed" },
      },
    }),
  );

  assert.match(markup, /aria-label="Edit tenant"/);
  assert.doesNotMatch(markup, />Edit tenant</);
  assert.match(markup, /aria-label="Actions"/);
});

test("defaults data tables to newest creation date unless explicitly overridden", () => {
  assert.deepEqual(
    ciResolveDataTableInitialSorting(["name", "createdAt"], undefined),
    [{ id: "createdAt", desc: true }],
  );
  assert.deepEqual(
    ciResolveDataTableInitialSorting(["name", "createdAt"], []),
    [],
  );
  assert.deepEqual(
    ciResolveDataTableInitialSorting(
      ["name", "createdAt"],
      [{ id: "name", desc: false }],
    ),
    [{ id: "name", desc: false }],
  );

  const markup = renderToStaticMarkup(
    createElement(CiDataTable, {
      columns: [
        { accessorKey: "name", header: "Name" },
        { accessorKey: "createdAt", header: "Created" },
      ],
      data: [
        { name: "Older", createdAt: "2026-08-29T10:00:00.000Z" },
        { name: "Newer", createdAt: "2026-08-30T10:00:00.000Z" },
      ],
      config: {
        excelExport: false,
        pagination: { enabled: false },
      },
    }),
  );
  const tableBody = markup.slice(
    markup.indexOf("<tbody"),
    markup.indexOf("</tbody>"),
  );
  assert.ok(tableBody.indexOf("Newer") < tableBody.indexOf("Older"));
});

test("renders selected chips in alphabetical order", () => {
  const markup = renderToStaticMarkup(
    createElement(CiSearchableChipMultiSelect, {
      id: "tenants",
      label: "Tenants",
      placeholder: "Add a tenant",
      options: [],
      selectedItems: [
        { id: "z", label: "Zeta Company" },
        { id: "a", label: "Acme Company" },
      ],
      onAdd: () => undefined,
      onRemove: () => undefined,
    }),
  );

  assert.ok(markup.indexOf("Acme Company") < markup.indexOf("Zeta Company"));
});
