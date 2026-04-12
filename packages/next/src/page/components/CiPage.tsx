"use client";

import { useEffect, useRef } from "react";
import { FileText } from "lucide-react"; // Default/fallback icon for pages
import { NextIntlClientProvider } from "next-intl";
import { ciStartTrace } from "@cloudigniter/core";
import { CiPageHeader } from "./CiPageHeader";
import { CiPageLoader } from "./CiPageLoader";
import { CiBreadcrumbs, ciBuildBreadcrumbsFromConfig } from "./breadcrumbs";
import type { CiPageProps } from "../types";

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
  /**
   * Destructure page setup with sensible defaults.
   * These values are typically authored alongside the route configuration.
   */
  const {
    title = "Page",
    subtitle,
    icon = <FileText className="ci-page-icon" />,
    actions,
    showPageHeader = true,
    showBreadcrumbs,
    layoutHasHeader,
    layoutHasFooter,
  } = setup;

  /** Normalize login flag */
  const isLoginPage = login ?? false;

  /**
   * Build breadcrumb items based on the page setup.
   * This is configuration-driven and does not inspect the URL directly.
   */
  const breadcrumbItems = ciBuildBreadcrumbsFromConfig(setup);

  /**
   * Reference to the scrollable page container.
   * Used by PageHeader to react to scroll position (collapse, shadow, etc.).
   */
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  /** Scroll threshold (px) after which header behavior changes */
  const THRESHOLD = 90;

  /////////////////////////////////////////////////////////////////////////////////////////
  // Client-side tracing
  //
  // This instruments page mount/unmount and render duration.
  // Tracing is enabled/disabled via CloudIgniter configuration.
  /////////////////////////////////////////////////////////////////////////////////////////
  const { logger, done } = ciStartTrace(
    config?.ciConfig.traceLog,
    { source: "client", tag: `Page:${name}` },
    { name: `Page` },
  );

  /**
   * Log initial mount and cleanly log unmount.
   * The `done()` call records render duration metrics if enabled.
   */
  useEffect(() => {
    // Stop the render timer (records a "duration" metric)
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

    // Intentionally run once on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Layout height contributions.
   * These values are injected as CSS variables by the global layout.
   * We subtract them from 100dvh to produce a stable scroll container.
   */
  const headerPart = layoutHasHeader
    ? "var(--spacing-primary-header-height, 70px)"
    : "0px";
  const breadcrumbsPart = showBreadcrumbs
    ? "var(--spacing-breadcrumb-height, 40px)"
    : "0px";
  const footerPart = layoutHasFooter
    ? "var(--spacing-footer-height, 32px)"
    : "0px";

  return (
    <>
      {/* Breadcrumbs are suppressed on login pages */}
      {showBreadcrumbs && !isLoginPage && (
        <div className="ci-breadcrumb-wrapper">
          <CiBreadcrumbs
            items={breadcrumbItems}
            dir={config?.ciConfig.direction}
            className="ci-breadcrumb"
            withStructuredData={false}
          />
        </div>
      )}

      {/* Main scroll container for the page */}
      <section
        ref={scrollContainerRef}
        className={[
          isLoginPage ? "ci-login-page-content" : "ci-page-content",
          !isLoginPage && showBreadcrumbs ? "has-breadcrumbs" : "",
        ].join(" ")}
        style={{
          // Smooth scrolling on iOS
          WebkitOverflowScrolling: "touch",

          // Prevent scroll chaining into the body
          overscrollBehavior: "contain",

          overflowY: "auto",
          overflowX: "hidden",

          /**
           * Critical: give the container an explicit height.
           * Uses dvh to behave correctly on mobile browsers.
           */
          height: `calc(100dvh - ${headerPart} - ${breadcrumbsPart} - ${footerPart})`,

          /**
           * Required when nested inside flex layouts
           * to allow proper shrinking.
           */
          minHeight: 0,
        }}
      >
        {/* Page header (title, subtitle, actions) */}
        {showPageHeader && !isLoginPage && (
          <CiPageHeader
            config={config}
            title={title}
            subtitle={subtitle}
            icon={icon}
            actions={actions}
            scrollContainerRef={scrollContainerRef}
            threshold={THRESHOLD}
          />
        )}

        {/* Page content */}
        <div
          className={
            isLoginPage
              ? "ci-login-page-content-inner"
              : "ci-page-content-inner"
          }
        >
          <NextIntlClientProvider
            locale={config?.ciConfig.locale}
            messages={config?.ciConfig.messages}
          >
            {children}
          </NextIntlClientProvider>
        </div>
      </section>

      {/* Global page loader overlay (controlled elsewhere) */}
      <CiPageLoader />
    </>
  );
}
