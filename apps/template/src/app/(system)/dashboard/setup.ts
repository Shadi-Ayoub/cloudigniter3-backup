import type { CiNextDashboardCardProps } from "@cloudigniter/next/ui/client";

export const setup: CiNextDashboardCardProps[] = [
  {
    id: "dashboard-security",
    icon: "ci:shield-lock-outline",
    label: "Security",
    description:
      "Govern roles, permissions, assignments, resources, and identity-provider mappings.",
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
      "Preview semantic colors, typography, components, and theme behavior.",
    meta: "Design system",
    route: "/dashboard/theme",
    namespace: "dashboard",
  },
  {
    id: "dashboard-tenants",
    icon: "ci:office-building-outline",
    label: "Tenants",
    description:
      "Operate tenant workspaces, status, regional settings, and organizational structure.",
    meta: "Multi-tenant operations",
    route: "/dashboard/tenants",
    namespace: "dashboard",
  },
];
