import type { CiNextDashboardCardProps } from "@cloudigniter/next/ui/client";

export const setup: CiNextDashboardCardProps[] = [
  {
    id: "dashboard-security",
    icon: "ci:shield-lock-outline",
    label: "Security",
    description:
      "Centralizes CloudIgniter's attribute- and role-based access-control model: resource catalogs define protected capabilities, privileges define allowed or denied actions, and scoped assignments determine where a role applies. Example: register identity.users, grant the admin role the identity.users.read privilege, and assign that role within a specific tenant.",
    meta: "ARBAC policy center",
    badge: "Protected",
    tone: "security",
    route: "/dashboard/security",
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
];
