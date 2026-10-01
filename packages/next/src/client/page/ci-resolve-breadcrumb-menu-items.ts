import type { CiBreadcrumbItem } from "@cloudigniter/core/types";

interface CiBreadcrumbMenuItem {
  item: CiBreadcrumbItem;
  label: string;
  current: boolean;
  children: CiBreadcrumbMenuItem[];
}

function ciNormalizeBreadcrumbPath(path: string): string {
  const pathname = path.split(/[?#]/, 1)[0] ?? path;
  return pathname === "/" ? pathname : pathname.replace(/\/+$/, "");
}

/** Internal presentation model; preserve hierarchy and never mutate page setup. */
export function ciResolveBreadcrumbMenuItems(
  items: CiBreadcrumbItem[],
  pathname: string,
  translate: (key: string) => string,
  locale: string,
): CiBreadcrumbMenuItem[] {
  return items
    .filter((item) => !item.hidden)
    .map((item) => ({
      item,
      label: item.i18nKey ? translate(item.i18nKey) : item.label ?? "",
      current: Boolean(item.current || (item.href &&
        ciNormalizeBreadcrumbPath(item.href) === ciNormalizeBreadcrumbPath(pathname))),
      children: ciResolveBreadcrumbMenuItems(item.children ?? [], pathname, translate, locale),
    }))
    // Keep the current section as a submenu when it still has other destinations.
    .filter((item) => !item.current || item.children.length > 0)
    .sort((left, right) => left.label.localeCompare(right.label, locale));
}
