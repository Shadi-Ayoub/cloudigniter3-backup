"use client";

import { useEffect, useRef } from "react";
import { FileText, Home } from "lucide-react"; // Default/fallback icon for pages
import { NextIntlClientProvider } from "next-intl";
import {
  CI_PAGE_HEADER_SCROLL_THRESHOLD,
  ciBuildBreadcrumbsFromConfig,
  CiPageHeader,
  CiPageLoader,
  CiPageShell,
} from "@cloudigniter/core/client";
import { ciStartTraceClient } from "@cloudigniter/core/client";
import { CiBreadcrumbs } from "./CiBreadcrumbs";
import type { CiPageProps } from "@ci-next/types";

/**
 * CloudIgniter Page
 *
 * Responsibilities:
 * - Owns the **scroll container** for the page
 * - Renders optional breadcrumbs and page header
 * - Applies layout-aware height calculations (header / breadcrumbs / footer)
 * - Wraps children with i18n provider
 * - Integrates client-side trace logging
 * - Hosts the global PageLoader overlay
 *
 * This component is intentionally **purely client-side** and should not contain
 * server-only logic.
 */
export function CiPage({
  config,
  name,
  setup = {},
  login,
  children,
}: CiPageProps) {
  const {
    title = "Page",
    subtitle,
    icon = <FileText className="ci-page-icon" />,
    actions,
    showPageHeader = true,
    showBreadcrumbs = true,
    layoutHasHeader = true,
    layoutHasFooter = true,
  } = setup;

  const isLoginPage = login ?? false;
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const breadcrumbItems = ciBuildBreadcrumbsFromConfig({
    ...setup,
    homeIcon: <Home className="size-4" />,
  });

  const { logger, done } = ciStartTraceClient(
    config?.ciConfig.traceLog,
    { source: "client", tag: `Page:${name}` },
    { name: "Page" },
  );

  useEffect(() => {
    done({ phase: "mount" });

    logger.log({
      type: "component",
      name: "Page",
      scope: "layout",
      event: `mount <Page> name=${name}`,
    });

    return () =>
      logger.log({
        type: "component",
        event: `unmount <Page> ${name}`,
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const breadcrumbsSlot = (
    <div className="ci-breadcrumb-wrapper">
      <CiBreadcrumbs
        items={breadcrumbItems}
        dir={config?.ciConfig.direction}
        className="ci-breadcrumb"
        withStructuredData={false}
      />
    </div>
  );

  const headerSlot = showPageHeader ? (
    <CiPageHeader
      title={title}
      subtitle={subtitle}
      icon={icon}
      actions={actions}
      scrollContainerRef={scrollContainerRef}
      threshold={CI_PAGE_HEADER_SCROLL_THRESHOLD}
    />
  ) : null;

  return (
    <CiPageShell
      scrollContainerRef={scrollContainerRef}
      isLoginPage={isLoginPage}
      showBreadcrumbs={showBreadcrumbs}
      layoutHasHeader={layoutHasHeader}
      layoutHasFooter={layoutHasFooter}
      breadcrumbsSlot={breadcrumbsSlot}
      headerSlot={headerSlot}
      loaderSlot={<CiPageLoader />}
    >
      <NextIntlClientProvider
        locale={config?.ciConfig.locale}
        messages={setup.messages ?? config?.ciConfig.messages}
      >
        {children}
      </NextIntlClientProvider>
    </CiPageShell>
  );
}
