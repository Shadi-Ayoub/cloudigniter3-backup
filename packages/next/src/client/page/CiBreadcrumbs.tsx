"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type {
  CiBreadcrumbItem,
  CiLocaleDirection,
} from "@cloudigniter/core/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@cloudigniter/ui/client";
import { CiNextNavigateWithLoader } from "../navigation";

export interface CiBreadcrumbsProps {
  items: CiBreadcrumbItem[];
  dir?: CiLocaleDirection;
  className?: string;
  /** If true, injects JSON-LD microdata for breadcrumbs. */
  withStructuredData?: boolean; // a simple on/off switch for emitting standards-compliant breadcrumb SEO metadata
  /**
   * If true, breadcrumb items with `children` expose those routes in a menu.
   * The menu opens on mouse hover and is also available by keyboard or tap.
   */
  withChildrenMenu?: boolean;
}

interface CiBreadcrumbChildrenMenuProps {
  item: CiBreadcrumbItem & { _label: string };
  content: ReactNode;
  isClickable: boolean;
  dir: CiLocaleDirection;
}

function ciNormalizeBreadcrumbPath(path: string): string {
  const pathname = path.split(/[?#]/, 1)[0] ?? path;
  return pathname === "/" ? pathname : pathname.replace(/\/+$/, "");
}

function CiBreadcrumbChildrenMenu({
  item,
  content,
  isClickable,
  dir,
}: CiBreadcrumbChildrenMenuProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const children = (item.children ?? [])
    .filter(
      (child) =>
        !child.hidden &&
        !child.current &&
        (!child.href ||
          ciNormalizeBreadcrumbPath(child.href) !==
            ciNormalizeBreadcrumbPath(pathname)),
    )
    .map((child, index) => ({
      child,
      index,
      label: child.i18nKey ? t(child.i18nKey) : child.label ?? "",
    }))
    .sort((left, right) => left.label.localeCompare(right.label));

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = undefined;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  useEffect(
    () => () => {
      cancelClose();
    },
    [],
  );

  if (!children.length) {
    return isClickable ? (
      <CiNextNavigateWithLoader
        href={item.href!}
        className="hover:bg-muted-100 dark:hover:bg-muted-900 focus-visible:ring-ring/60 rounded px-1 py-0.5 underline-offset-4 transition hover:underline focus-visible:ring-2 focus-visible:outline-none active:scale-[0.98]"
      >
        {content}
      </CiNextNavigateWithLoader>
    ) : (
      <span
        aria-current={item.current ? "page" : undefined}
        className={item.current ? "text-foreground" : ""}
      >
        {content}
      </span>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} dir={dir}>
      <span
        className="inline-flex items-center"
        onMouseEnter={() => {
          cancelClose();
          setOpen(true);
        }}
        onMouseLeave={scheduleClose}
      >
        {isClickable ? (
          <CiNextNavigateWithLoader
            href={item.href!}
            className="hover:bg-muted-100 dark:hover:bg-muted-900 focus-visible:ring-ring/60 rounded-s px-1 py-0.5 underline-offset-4 transition hover:underline focus-visible:ring-2 focus-visible:outline-none active:scale-[0.98]"
          >
            {content}
          </CiNextNavigateWithLoader>
        ) : (
          <span
            aria-current={item.current ? "page" : undefined}
            className={item.current ? "text-foreground" : ""}
          >
            {content}
          </span>
        )}

        <DropdownMenuTrigger
          aria-label={`Show pages in ${item._label}`}
          className="group hover:bg-muted-100 dark:hover:bg-muted-900 focus-visible:ring-ring/60 inline-flex size-6 items-center justify-center rounded-e transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none"
        >
          <ChevronDown
            className="size-3.5 opacity-70 transition-transform duration-200 group-hover:scale-110 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </DropdownMenuTrigger>
      </span>

      <DropdownMenuContent
        align="start"
        sideOffset={4}
        className="min-w-48 duration-200"
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
      >
        {children.map(({ child, index, label }) => {
          return child.href ? (
            <DropdownMenuItem key={`${child.i18nKey ?? child.label ?? index}`} asChild>
              <CiNextNavigateWithLoader
                href={child.href}
                onNavigateStart={() => setOpen(false)}
                className="cursor-pointer transition-colors duration-150 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground motion-reduce:transition-none"
              >
                {child.icon ? <span className="size-4">{child.icon}</span> : null}
                <span>{label}</span>
              </CiNextNavigateWithLoader>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              key={`${child.i18nKey ?? child.label ?? index}`}
              disabled
            >
              {child.icon ? <span className="size-4">{child.icon}</span> : null}
              <span>{label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CiBreadcrumbs({
  items,
  dir = "ltr",
  className,
  withStructuredData = true,
  withChildrenMenu = false,
}: CiBreadcrumbsProps) {
  const t = useTranslations();

  const visible = useMemo(() => items.filter((i) => !i.hidden), [items]);

  const withLabels = useMemo(
    () =>
      visible.map((i) => ({
        ...i,
        _label: i.i18nKey ? t(i.i18nKey) : i.label ?? "",
      })),
    [visible, t],
  );

  // Mark last as current unless an item explicitly sets current
  const normalized = useMemo(() => {
    const anyExplicit = withLabels.some((i) => i.current);
    if (anyExplicit) return withLabels;
    return withLabels.map((i, idx) => ({
      ...i,
      current:
        idx === withLabels.length - 1 && !i.href
          ? true
          : idx === withLabels.length - 1,
    }));
  }, [withLabels]);

  const jsonLd = useMemo(() => {
    if (!withStructuredData) return null;
    const list = normalized.map((i, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: i._label,
      item: i.href ?? undefined,
    }));
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: list,
    };
  }, [normalized, withStructuredData]);

  return (
    <nav
      aria-label="Breadcrumb"
      className={className ?? "text-muted-700 dark:text-muted-300 text-sm"}
      dir={dir}
    >
      <ol className="flex flex-wrap items-center gap-1">
        {normalized.map((item, idx) => {
          const isLast = idx === normalized.length - 1;

          const content = (
            <span className="inline-flex max-w-[20ch] items-center gap-1 truncate">
              {item.icon ? <span className="size-4">{item.icon}</span> : null}
              <span
                className={item.current ? "font-medium" : ""}
                title={item._label}
              >
                {item._label}
              </span>
            </span>
          );

          const isClickable = !!item.href && !item.current && !isLast;

          return (
            <li
              key={`${item.i18nKey ?? item.label ?? idx}`}
              className="inline-flex items-center"
            >
              {withChildrenMenu ? (
                <CiBreadcrumbChildrenMenu
                  item={item}
                  content={content}
                  isClickable={isClickable}
                  dir={dir}
                />
              ) : isClickable ? (
                <CiNextNavigateWithLoader
                  href={item.href!}
                  className="hover:bg-muted-100 dark:hover:bg-muted-900 focus-visible:ring-ring/60 rounded px-1 py-0.5 underline-offset-4 transition hover:underline focus-visible:ring-2 focus-visible:outline-none active:scale-[0.98]"
                >
                  {content}
                </CiNextNavigateWithLoader>
              ) : (
                <span
                  aria-current={item.current ? "page" : undefined}
                  className={item.current ? "text-foreground" : ""}
                >
                  {content}
                </span>
              )}

              {!isLast && (
                <span aria-hidden="true" className="mx-1 inline-flex">
                  <ChevronRight
                    className={
                      dir === "rtl"
                        ? "size-4 rotate-180 opacity-60"
                        : "size-4 opacity-60"
                    }
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {withStructuredData && jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </nav>
  );
}
