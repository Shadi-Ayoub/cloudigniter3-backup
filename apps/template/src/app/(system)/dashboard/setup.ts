import { type CiDashboardCardProps } from "@cloudigniter/next/ui/client";

export const setup: CiDashboardCardProps[] = [
  {
    id: "dashboard-install",
    icon: "ci:rocket-launch-outline",
    label: "install",
    route: "/dashboard/dev/install",
    setup: true,
    namespace: "dashboard",
  },
  {
    id: "dashboard-users",
    icon: "ci:account-group",
    label: "users",
    route: "/dashboard/users",
    namespace: "dashboard",
  },
  {
    id: "dashboard-admins",
    icon: "ci:badge-account-outline",
    label: "admins",
    route: "/dashboard/admins",
    namespace: "dashboard",
  },
  {
    id: "dashboard-security",
    icon: "ci:shield-lock-outline",
    label: "security",
    route: "/dashboard/auth",
    namespace: "dashboard",
  },
  {
    id: "dashboard-theme",
    icon: "ci:palette-outline",
    label: "theme",
    route: "/dashboard/theme",
    namespace: "dashboard",
  },
  {
    id: "dashboard-languages",
    icon: "ci:translate",
    label: "languages",
    route: "/dashboard/locales",
    namespace: "dashboard",
  },
  {
    id: "dashboard-settings",
    icon: "ci:cog-outline",
    label: "settings",
    route: "/dashboard/settings",
    namespace: "dashboard",
  },
  {
    id: "dashboard-tenants",
    icon: "ci:office-building-outline",
    label: "tenants",
    route: "/dashboard/tenants",
    namespace: "dashboard",
  },
  {
    id: "dashboard-devtools",
    icon: "ci:tools",
    label: "devtools",
    route: "/dashboard/dev",
    namespace: "dashboard",
  },
];
