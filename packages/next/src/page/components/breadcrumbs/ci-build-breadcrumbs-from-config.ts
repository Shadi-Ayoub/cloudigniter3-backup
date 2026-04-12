import { createElement } from "react";
import { Home } from "lucide-react";

import type { CiBreadcrumbItem, CiPageSetup } from "../../types";
export function ciBuildBreadcrumbsFromConfig(
  cfg: Pick<
    CiPageSetup,
    | "breadcrumbs"
    | "homeHref"
    | "homeI18nKey"
    | "includeHomeInBreadcrumbs"
    | "title"
  >,
): CiBreadcrumbItem[] {
  const includeHome = cfg.includeHomeInBreadcrumbs ?? true;
  const items: CiBreadcrumbItem[] = [];

  if (includeHome) {
    items.push({
      i18nKey: cfg.homeI18nKey ?? "common.home",
      label: "Home",
      href: cfg.homeHref ?? "/",
      icon: createElement(Home, { className: "size-4" }),
    });
  }

  if (cfg.breadcrumbs?.length) {
    items.push(...cfg.breadcrumbs);
  } else if (cfg.title) {
    // Minimal default: just show the page title as current
    items.push({ label: cfg.title, current: true });
  }

  // Ensure last item is current if none marked
  if (!items.some((i) => i.current)) {
    items[items.length - 1] = { ...items[items.length - 1], current: true };
  }

  return items;
}
