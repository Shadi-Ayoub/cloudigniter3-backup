import type { ReactNode } from "react";
import type { CiDashboardIcon } from "@ci-next/ui/client";

/**
 * Resolve a consumer-supplied icon into a renderable React node.
 */
export function ciResolveDashboardIcon(icon?: CiDashboardIcon): ReactNode {
  if (!icon) {
    return null;
  }

  if (typeof icon === "function") {
    const CiIcon = icon;
    return <CiIcon />;
  }

  return icon;
}
