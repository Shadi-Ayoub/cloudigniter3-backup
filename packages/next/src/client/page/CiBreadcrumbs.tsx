"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type {
  CiBreadcrumbItem,
  CiLocaleDirection,
} from "@cloudigniter/core/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@cloudigniter/ui/client";
import { CiNextNavigateWithLoader } from "../navigation";
import { ciResolveBreadcrumbMenuItems } from "./ci-resolve-breadcrumb-menu-items";

export interface CiBreadcrumbsProps {
  items: CiBreadcrumbItem[];
  dir?: CiLocaleDirection;
  className?: string;
  /** If true, injects JSON-LD microdata for breadcrumbs. */
  withStructuredData?: boolean; // a simple on/off switch for emitting standards-compliant breadcrumb SEO metadata
  /**
   * If true, recursively expose `children` in hover menus. Parent labels remain
   * links; arrows and keyboard controls open submenus without navigating.
   */
  withChildrenMenu?: boolean;
}

interface CiBreadcrumbChildrenMenuProps {
  item: CiBreadcrumbItem & { _label: string };
  content: ReactNode;
  isClickable: boolean;
  dir: CiLocaleDirection;
}

interface CiBreadcrumbMenuItemsProps {
  items: ReturnType<typeof ciResolveBreadcrumbMenuItems>;
  onNavigate: () => void;
  cancelClose: () => void;
  scheduleClose: () => void;
}

const menuItemClassName = "min-h-11 cursor-pointer gap-2 transition-colors duration-150 focus:bg-accent focus:text-accent-foreground motion-reduce:transition-none";

function CiBreadcrumbMenuItems({ items, ...menuProps }: CiBreadcrumbMenuItemsProps) {
  return items.map((entry, index) => {
    const key = entry.item.href ?? entry.item.i18nKey ?? `${entry.label}-${index}`;
    if (entry.children.length) {
      return <CiBreadcrumbSubmenu key={key} entry={entry} {...menuProps} />;
    }

    const content = <>
      {entry.item.icon ? <span className="size-4 shrink-0">{entry.item.icon}</span> : null}
      <span>{entry.label}</span>
    </>;

    return entry.item.href ? (
      <DropdownMenuItem key={key} asChild textValue={entry.label}>
        <CiNextNavigateWithLoader
          href={entry.item.href}
          onNavigateStart={menuProps.onNavigate}
          className={menuItemClassName}
        >
          {content}
        </CiNextNavigateWithLoader>
      </DropdownMenuItem>
    ) : (
      <DropdownMenuItem key={key} disabled>{content}</DropdownMenuItem>
    );
  });
}

function CiBreadcrumbSubmenu({
  entry,
  ...menuProps
}: Omit<CiBreadcrumbMenuItemsProps, "items"> & {
  entry: CiBreadcrumbMenuItemsProps["items"][number];
}) {
  const [open, setOpen] = useState(false);
  const content = <>
    {entry.item.icon ? <span className="size-4 shrink-0">{entry.item.icon}</span> : null}
    <span className="flex-1">{entry.label}</span>
  </>;

  return (
    <DropdownMenuSub open={open} onOpenChange={setOpen}>
      {entry.item.href && !entry.current ? (
        <DropdownMenuSubTrigger asChild textValue={entry.label}>
          <CiNextNavigateWithLoader
            href={entry.item.href}
            onNavigateStart={menuProps.onNavigate}
            className={`${menuItemClassName} py-0 pe-0`}
            onKeyDown={(event) => {
              // Enter follows the parent link; Space/directional arrows retain
              // Radix's submenu controls, including the reversed RTL direction.
              if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.click();
              }
            }}
          >
            {content}
            <span
              data-breadcrumb-expand=""
              aria-hidden="true"
              className="ms-auto inline-flex min-h-11 w-11 shrink-0 items-center justify-center self-stretch"
              onClick={(event) => {
                event.preventDefault();
                setOpen(true);
              }}
            >
              <ChevronRight className="size-4 rtl:rotate-180" />
            </span>
          </CiNextNavigateWithLoader>
        </DropdownMenuSubTrigger>
      ) : (
        <DropdownMenuSubTrigger textValue={entry.label} className={menuItemClassName}>
          {content}
        </DropdownMenuSubTrigger>
      )}
      <DropdownMenuPortal>
        <DropdownMenuSubContent
          sideOffset={4}
          collisionPadding={8}
          className="min-w-48 max-w-[calc(100vw-1rem)] max-h-(--radix-dropdown-menu-content-available-height) overflow-y-auto duration-200 motion-reduce:animate-none"
          onMouseEnter={menuProps.cancelClose}
          onMouseLeave={menuProps.scheduleClose}
        >
          <CiBreadcrumbMenuItems items={entry.children} {...menuProps} />
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}

function CiBreadcrumbChildrenMenu({
  item,
  content,
  isClickable,
  dir,
}: CiBreadcrumbChildrenMenuProps) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const keyboardInteraction = useRef(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const children = ciResolveBreadcrumbMenuItems(item.children ?? [], pathname, t, locale);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = undefined;
    }
  }, []);

  const resetMenu = useCallback(() => {
    cancelClose();
    keyboardInteraction.current = false;
    setOpen(false);
    if (document.activeElement === triggerRef.current) {
      triggerRef.current?.blur();
    }
  }, [cancelClose]);

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => {
      // Moving the mouse away must not dismiss an active keyboard interaction.
      if (!keyboardInteraction.current) resetMenu();
    }, 150);
  };

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) resetMenu();
    };
    window.addEventListener("blur", resetMenu);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      cancelClose();
      window.removeEventListener("blur", resetMenu);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [cancelClose, resetMenu]);

  useEffect(() => {
    resetMenu();
  }, [pathname, resetMenu]);

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
        onKeyDownCapture={() => { keyboardInteraction.current = true; }}
        onPointerDownCapture={() => { keyboardInteraction.current = false; }}
        onMouseEnter={() => {
          keyboardInteraction.current = false;
          cancelClose();
          setOpen(true);
        }}
        onMouseLeave={scheduleClose}
      >
        {isClickable ? (
          <CiNextNavigateWithLoader
            href={item.href!}
            onNavigateStart={resetMenu}
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
          ref={triggerRef}
          aria-label={`Show pages in ${item._label}`}
          className="group hover:bg-muted-100 dark:hover:bg-muted-900 focus-visible:ring-ring/60 inline-flex size-6 pointer-coarse:size-11 items-center justify-center rounded-e transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none"
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
        collisionPadding={8}
        className="min-w-48 max-w-[calc(100vw-1rem)] duration-200 motion-reduce:animate-none"
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
        onKeyDownCapture={() => { keyboardInteraction.current = true; }}
        onPointerMoveCapture={() => { keyboardInteraction.current = false; }}
        onPointerDownCapture={() => { keyboardInteraction.current = false; }}
        onCloseAutoFocus={(event) => {
          // Radix normally restores focus to the disclosure after every close.
          // Only keyboard dismissal should leave that button focused.
          if (!keyboardInteraction.current) {
            event.preventDefault();
            if (document.activeElement === triggerRef.current) {
              triggerRef.current?.blur();
            }
          }
        }}
      >
        <CiBreadcrumbMenuItems
          items={children}
          onNavigate={resetMenu}
          cancelClose={cancelClose}
          scheduleClose={scheduleClose}
        />
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
