"use client";

import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import type { CiBreadcrumbItem } from "@cloudigniter/core/types";
import { CiNavigateWithLoader } from "@ci-next/client";

export interface CiBreadcrumbsProps {
  items: CiBreadcrumbItem[];
  dir?: "ltr" | "rtl";
  className?: string;
  /** If true, injects JSON-LD microdata for breadcrumbs. */
  withStructuredData?: boolean; // a simple on/off switch for emitting standards-compliant breadcrumb SEO metadata
}

export function CiBreadcrumbs({
  items,
  dir = "ltr",
  className,
  withStructuredData = true,
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
              {isClickable ? (
                <CiNavigateWithLoader
                  href={item.href!}
                  className="hover:bg-muted-100 dark:hover:bg-muted-900 focus-visible:ring-ring/60 rounded px-1 py-0.5 underline-offset-4 transition hover:underline focus-visible:ring-2 focus-visible:outline-none active:scale-[0.98]"
                >
                  {content}
                </CiNavigateWithLoader>
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
