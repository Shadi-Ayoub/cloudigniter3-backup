import type { CiBreadcrumbItem } from "@cloudigniter/core/types";

export const dashboardBreadcrumbChildren: CiBreadcrumbItem[] = [
  { label: "Security", href: "/dashboard/security" },
  { label: "Users", href: "/dashboard/users" },
  { label: "Administrators", href: "/dashboard/administrators" },
  { label: "Resources Catalog", href: "/dashboard/resources" },
  { label: "Appearance", href: "/dashboard/theme" },
  { label: "Tenants", href: "/dashboard/tenants" },
  { label: "Org Units", href: "/dashboard/org-units" },
  { label: "Trash", href: "/dashboard/trash" },
];

export const securityBreadcrumbChildren: CiBreadcrumbItem[] = [
  { label: "Roles", href: "/dashboard/security/roles" },
  { label: "Permissions", href: "/dashboard/security/permissions" },
  { label: "Role assignments", href: "/dashboard/security/assignments" },
  {
    label: "Identity-provider groups",
    href: "/dashboard/security/identity-groups",
  },
];
