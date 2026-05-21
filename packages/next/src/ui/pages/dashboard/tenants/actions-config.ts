import type { CiDataTableAction } from "@cloudigniter/core/client";
import type { CiTenantHtmlTableRow } from "@cloudigniter/core/types";

export const tenantActions = [
  {
    id: "view",
    label: "View",
    onSelect: (t: CiTenantHtmlTableRow) => console.log("view", t.tenantId),
  },
  {
    id: "edit",
    label: "Edit",
    onSelect: (t: CiTenantHtmlTableRow) => console.log("edit", t.tenantId),
    isDisabled: (t: CiTenantHtmlTableRow) => t.status === "archived",
  },
  {
    id: "toggle-status",
    label: "Suspend / Activate",
    onSelect: (t: CiTenantHtmlTableRow) =>
      console.log("toggle-status", t.tenantId, t.status),
    isDisabled: (t: CiTenantHtmlTableRow) =>
      t.status === "archived" || t.isSystem === true,
  },
  {
    id: "delete",
    label: "Delete",
    variant: "destructive",
    onSelect: (t: CiTenantHtmlTableRow) => console.log("delete", t.tenantId),
    isVisible: (t: CiTenantHtmlTableRow) => !t.isSystem,
    isDisabled: (t: CiTenantHtmlTableRow) => t.status === "archived",
  },
] satisfies CiDataTableAction<CiTenantHtmlTableRow>[];
