import type { CiBreadcrumbItem } from "@cloudigniter/core/types";

export const dashboardBreadcrumbChildren: CiBreadcrumbItem[] = [
  { label: "Security", href: "/dashboard/security" },
  { label: "Appearance", href: "/dashboard/theme" },
  { label: "Tenants", href: "/dashboard/tenants" },
];

export const securityBreadcrumbChildren: CiBreadcrumbItem[] = [
  { label: "Roles", href: "/dashboard/security/roles" },
  { label: "Permissions", href: "/dashboard/security/permissions" },
  { label: "Role assignments", href: "/dashboard/security/assignments" },
  { label: "Resource catalog", href: "/dashboard/security/resources" },
  {
    label: "Identity-provider groups",
    href: "/dashboard/security/identity-groups",
  },
];
