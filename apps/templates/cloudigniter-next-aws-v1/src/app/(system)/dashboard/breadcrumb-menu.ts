import type { CiBreadcrumbItem } from "@cloudigniter/core/types";

export const securityBreadcrumbChildren: CiBreadcrumbItem[] = [
  { label: "Roles", href: "/dashboard/security/roles" },
  { label: "Permissions", href: "/dashboard/security/permissions" },
  { label: "Role assignments", href: "/dashboard/security/assignments" },
  {
    label: "Identity-provider groups",
    href: "/dashboard/security/identity-groups",
  },
];

export const settingsBreadcrumbChildren: CiBreadcrumbItem[] = [
  { label: "Private settings", href: "/dashboard/settings/private" },
  { label: "Public settings", href: "/dashboard/settings/public" },
];

export const dashboardBreadcrumbChildren: CiBreadcrumbItem[] = [
  { label: "Settings", href: "/dashboard/settings", children: settingsBreadcrumbChildren },
  { label: "Security", href: "/dashboard/security", children: securityBreadcrumbChildren },
  { label: "Users", href: "/dashboard/users" },
  { label: "Administrators", href: "/dashboard/administrators" },
  { label: "Resources Catalog", href: "/dashboard/resources" },
  { label: "Appearance", href: "/dashboard/theme" },
  { label: "Tenants", href: "/dashboard/tenants" },
  { label: "Org Units", href: "/dashboard/org-units" },
  { label: "Trash", href: "/dashboard/trash" },
];
