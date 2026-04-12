# Example consumer usage

## With component icons

```ts
import { Settings, Users } from "lucide-react";
import type { CiDashboardCardConfig } from "@cloudigniter/next";

export const ciDashboardSetup: CiDashboardCardConfig[] = [
  {
    id: "users",
    route: "/admin/users",
    label: "users",
    icon: Users,
  },
  {
    id: "settings",
    route: "/admin/settings",
    label: "settings",
    icon: Settings,
  },
];
```

## With React nodes

```ts
import type { CiDashboardCardConfig } from "@cloudigniter/next";
import { FileText } from "lucide-react";

export const ciDashboardSetup: CiDashboardCardConfig[] = [
  {
    id: "docs",
    route: "https://docs.example.com",
    label: "documentation",
    icon: <FileText className="h-5 w-5" />,
    externalTarget: "_blank",
  },
  {
    id: "support",
    route: "mailto:support@example.com",
    label: "contactSupport",
    icon: <span>✉️</span>,
    externalTarget: "_self",
  },
];
```

## With custom styling

```ts
import { Users } from "lucide-react";
import type { CiDashboardCardConfig } from "@cloudigniter/next";

export const ciDashboardSetup: CiDashboardCardConfig[] = [
  {
    id: "users",
    route: "/admin/users",
    label: "users",
    icon: Users,
    className: "dashboard-card border-primary",
    contentClassName: "dashboard-card-content gap-3",
    iconClassName: "dashboard-card-icon text-primary",
    labelClassName: "dashboard-card-label font-semibold",
  },
];
```
