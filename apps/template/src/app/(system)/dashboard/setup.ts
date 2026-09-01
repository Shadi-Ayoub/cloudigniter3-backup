import type { CiNextDashboardCardProps } from "@cloudigniter/next/ui/client";

export const setup: CiNextDashboardCardProps[] = [
  {
    id: "dashboard-administrators",
    icon: "ci:badge-account-outline",
    label: "Administrators",
    description:
      "Manages administrator identities with explicit authority hierarchy, Root User protection, identity roles, and scoped access assignments.",
    meta: "Privileged identity governance",
    badge: "Amazon Cognito",
    tone: "security",
    route: "/dashboard/administrators",
    namespace: "dashboard",
  },
  {
    id: "dashboard-users",
    icon: "ci:account-group-outline",
    label: "Users",
    description:
      "Manages application users, their Amazon Cognito identities, fixed CloudIgniter profiles, identity roles, and scoped access assignments.",
    meta: "Identity administration",
    badge: "Amazon Cognito",
    tone: "security",
    route: "/dashboard/users",
    namespace: "dashboard",
  },
  {
    id: "dashboard-security",
    icon: "ci:shield-lock-outline",
    label: "Security",
    description:
      "Centralizes CloudIgniter's attribute- and role-based access-control model: roles group privileges, privileges allow or deny registered actions, and scoped assignments determine where a role applies.",
    meta: "ARBAC policy center",
    badge: "Protected",
    tone: "security",
    route: "/dashboard/security",
    namespace: "dashboard",
  },
  {
    id: "dashboard-resources",
    icon: "ci:shape-outline",
    label: "Resources Catalog",
    description:
      "Registers CloudIgniter's logical and operational vocabulary. Resources can represent domains such as tenants and Org Units or capabilities such as their managers and settings, each with stable actions and supported scopes.",
    meta: "Platform vocabulary",
    route: "/dashboard/resources",
    namespace: "dashboard",
  },
  {
    id: "dashboard-theme",
    icon: "ci:palette-outline",
    label: "Appearance",
    description:
      "Provides a controlled preview of the active design system, including semantic color tokens, typography, component states, responsive behavior, and light/dark theme parity. Example: validate that the identity.users administration table preserves readable contrast, clear status states, and accessible actions in both themes.",
    meta: "Design system",
    route: "/dashboard/theme",
    namespace: "dashboard",
  },
  {
    id: "dashboard-tenants",
    icon: "ci:office-building-outline",
    label: "Tenants",
    description:
      "Administers tenant lifecycle, operational status, regional configuration, and organizational boundaries used to isolate application data and authorization scope. Example: a tenant-scoped assignment may permit identity.users.read for Tenant A without granting access to the users managed by Tenant B.",
    meta: "Multi-tenant operations",
    route: "/dashboard/tenants",
    namespace: "dashboard",
  },
  {
    id: "dashboard-org-units",
    icon: "ci:office-building-outline",
    label: "Org Units",
    description:
      "Builds tenant-aware organizational trees, attaches shared departments to several companies, and preserves predecessor-aware access boundaries.",
    meta: "Shared organization trees",
    route: "/dashboard/org-units",
    namespace: "dashboard",
  },
  {
    id: "dashboard-trash",
    icon: "ci:trash-can-outline",
    label: "Trash",
    description:
      "Reviews resources removed through CloudIgniter's reversible deletion lifecycle. Privileged administrators can restore deleted tenants and users, while permanent deletion remains a separate verified action.",
    meta: "Deleted resources",
    badge: "Protected",
    tone: "security",
    route: "/dashboard/trash",
    namespace: "dashboard",
  },
];
