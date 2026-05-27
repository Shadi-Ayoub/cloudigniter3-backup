import { type ReactNode } from "react";
import type { CiBreadcrumbItem, CiPageSetup } from "@ci-core/client";

export type CiBuildBreadcrumbsFromConfigInput = Partial<
  Pick<
    CiPageSetup,
    | "breadcrumbs"
    | "homeHref"
    | "homeI18nKey"
    | "includeHomeInBreadcrumbs"
    | "title"
  >
> & {
  homeIcon?: ReactNode;
};

export function ciBuildBreadcrumbsFromConfig(
  config: CiBuildBreadcrumbsFromConfigInput,
): CiBreadcrumbItem[] {
  const includeHome = config.includeHomeInBreadcrumbs ?? true;
  const items: CiBreadcrumbItem[] = [];

  if (includeHome) {
    items.push({
      i18nKey: config.homeI18nKey ?? "common.home",
      label: "Home",
      href: config.homeHref ?? "/",
      icon: config.homeIcon,
    });
  }

  if (config.breadcrumbs?.length) {
    items.push(...config.breadcrumbs);
  } else if (config.title) {
    items.push({ label: config.title, current: true });
  }

  if (items.length > 0 && !items.some((item) => item.current)) {
    const last = items.at(-1);
    if (last) {
      items[items.length - 1] = { ...last, current: true };
    }
  }

  return items;
}

/**
 *
 * let Next pass the icon:
 * homeIcon?: ReactNode;
 *
 * Then in next:
 *
 * import { Home } from "lucide-react";
 * const breadcrumbItems = ciBuildBreadcrumbsFromConfig({
 *  ...setup,
 *  homeIcon: <Home className="size-4" />,
 * });
 *
 */
