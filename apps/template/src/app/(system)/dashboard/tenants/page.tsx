"use client";

import { Eye, Pencil, ShieldBan, Trash2 } from "lucide-react";
import type { CiTenantHtmlTableRow } from "@cloudigniter/core/types";
import {
  CiDataTable,
  ciDefineDataTable,
  type CiDataTableConfig,
} from "@cloudigniter/ui";

const tenantRows: CiTenantHtmlTableRow[] = [
  {
    tenantId: "tenant-abu-dhabi",
    name: "Abu Dhabi Campus",
    slug: "abu-dhabi-campus",
    type: "school",
    region: "UAE-AD",
    status: "active",
    usersCount: 420,
    createdAt: "2023-08-15T09:30:00Z",
  },
  {
    tenantId: "tenant-dubai",
    name: "Dubai Campus",
    slug: "dubai-campus-with-a-long-provider-generated-slug",
    type: "school",
    region: "UAE-DXB",
    status: "active",
    usersCount: 365,
    createdAt: "2023-08-18T10:00:00Z",
  },
  {
    tenantId: "tenant-head-office",
    name: "Head Office",
    slug: "head-office",
    type: "organization",
    region: "UAE",
    status: "active",
    isSystem: true,
    usersCount: 75,
    createdAt: "2022-12-01T08:00:00Z",
  },
  {
    tenantId: "tenant-sandbox",
    name: "Sandbox Tenant",
    slug: "sandbox",
    type: "department",
    region: "GLOBAL",
    status: "suspended",
    usersCount: 12,
    createdAt: "2024-02-05T14:45:00Z",
  },
];

const tenantTable = ciDefineDataTable<CiTenantHtmlTableRow>({
  getRowId: (tenant) => tenant.tenantId,
  information: {
    mode: "dialog",
    label: "Tenant information",
    title: (tenant) => tenant.name,
    description: (tenant) => `Tenant ID: ${tenant.tenantId}`,
  },
  columns: [
    {
      accessorKey: "name",
      header: "Tenant",
      meta: {
        ciDataTable: {
          label: "Tenant",
          className: "font-semibold",
          clickable: {
            href: ({ row }) => `/dashboard/tenants/${row.tenantId}`,
            ariaLabel: ({ row }) => `Open ${row.name}`,
          },
        },
      },
    },
    {
      accessorKey: "slug",
      header: "Slug",
      meta: {
        ciDataTable: {
          truncate: { maxWidth: 220, showTitle: true },
        },
      },
    },
    { accessorKey: "type", header: "Type" },
    { accessorKey: "region", header: "Region" },
    {
      accessorKey: "usersCount",
      header: "Users",
      meta: { ciDataTable: { className: "font-medium tabular-nums" } },
    },
    {
      accessorKey: "status",
      header: "Status",
      meta: {
        ciDataTable: {
          className: ({ value }) =>
            value === "active"
              ? "font-semibold text-emerald-700 dark:text-emerald-400"
              : "font-semibold text-amber-700 dark:text-amber-400",
          filter: {
            type: "select",
            placeholder: "All statuses",
            options: [
              { id: "active", label: "Active" },
              { id: "suspended", label: "Suspended" },
            ],
          },
        },
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ getValue }) =>
        new Intl.DateTimeFormat("en-AE", { dateStyle: "medium" }).format(
          new Date(String(getValue()))
        ),
      meta: {
        ciDataTable: {
          export: {
            header: "Created at",
            value: (tenant) => tenant.createdAt,
          },
        },
      },
    },
  ],
  filters: [
    {
      id: "type",
      label: "Tenant type",
      allLabel: "All types",
      options: [
        { id: "school", label: "School" },
        { id: "organization", label: "Organization" },
        { id: "department", label: "Department" },
      ],
    },
  ],
  rowActions: [
    {
      id: "view",
      label: "View",
      icon: <Eye />,
      display: "icon",
      onSelect: (tenant) => {
        window.location.assign(`/dashboard/tenants/${tenant.tenantId}`);
      },
    },
    {
      id: "edit",
      label: "Edit",
      icon: <Pencil />,
      display: "icon",
      disableWhen: (tenant) => tenant.isSystem === true,
      onSelect: (tenant) => {
        window.location.assign(`/dashboard/tenants/${tenant.tenantId}/edit`);
      },
    },
    {
      id: "delete",
      label: "Delete",
      icon: <Trash2 />,
      variant: "destructive",
      hideWhen: (tenant) => tenant.isSystem === true,
      onSelect: (tenant) => {
        window.alert(`Delete ${tenant.name}`);
      },
    },
  ],
  globalActions: [
    {
      id: "suspend",
      label: "Suspend selected",
      icon: <ShieldBan />,
      selection: "required",
      variant: "outline",
      onSelect: ({ selectedRows, clearSelection }) => {
        window.alert(`Suspend ${selectedRows.length} tenant(s)`);
        clearSelection();
      },
    },
  ],
});

const tableConfig: CiDataTableConfig = {
  formats: [
    { id: "table", label: "Table" },
    { id: "compact", label: "Compact" },
    { id: "cards", label: "Cards" },
  ],
  sorting: { initial: [{ id: "name", desc: false }] },
  pagination: {
    pageSize: 10,
    pageSizeOptions: [10, 25, 50],
    allowAll: false,
  },
  rowActions: { mode: "mixed", inlineCount: 2 },
  columnResizing: true,
  excelExport: {
    fileName: "cloudigniter-tenants.xlsx",
    sheetName: "Tenants",
    scope: "all-filtered",
  },
  persistence: {
    key: "template-tenants",
    columnWidths: true,
    filters: true,
    pageSize: true,
    format: true,
  },
};

/** Demonstrates the reusable object-management table in the template app. */
export default function TenantsPage() {
  return (
    <main className="w-full p-4 sm:p-6">
      <CiDataTable
        title="Tenants"
        description="Manage tenants, status, and access across CloudIgniter."
        definition={tenantTable}
        data={tenantRows}
        config={tableConfig}
        searchPlaceholder="Search tenants..."
      />
    </main>
  );
}
