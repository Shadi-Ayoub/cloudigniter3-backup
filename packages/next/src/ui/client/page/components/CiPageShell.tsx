"use client";

import type { CSSProperties } from "react";
import type { CiPageShellProps } from "@cloudigniter/core/types";

export function CiPageShell({
  children,
  scrollContainerRef,
  isLoginPage = false,
  showBreadcrumbs = false,
  layoutHasHeader = false,
  layoutHasFooter = false,
  breadcrumbsSlot,
  headerSlot,
  loaderSlot,
  className,
  innerClassName,
  style,
}: CiPageShellProps) {
  const headerPart = layoutHasHeader
    ? "var(--spacing-primary-header-height, 70px)"
    : "0px";

  const breadcrumbsPart = showBreadcrumbs
    ? "var(--spacing-breadcrumb-height, 40px)"
    : "0px";

  const footerPart = layoutHasFooter
    ? "var(--spacing-footer-height, 32px)"
    : "0px";

  const shellStyle: CSSProperties = {
    WebkitOverflowScrolling: "touch",
    overscrollBehavior: "contain",
    overflowY: "auto",
    overflowX: "hidden",
    height: `calc(100dvh - ${headerPart} - ${breadcrumbsPart} - ${footerPart})`,
    minHeight: 0,
    ...style,
  };

  return (
    <>
      {showBreadcrumbs && !isLoginPage ? breadcrumbsSlot : null}

      <section
        ref={scrollContainerRef}
        className={[
          isLoginPage ? "ci-login-page-content" : "ci-page-content",
          !isLoginPage && showBreadcrumbs ? "has-breadcrumbs" : "",
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={shellStyle}
      >
        {!isLoginPage ? headerSlot : null}

        <div
          className={
            innerClassName ??
            (isLoginPage
              ? "ci-login-page-content-inner"
              : "ci-page-content-inner")
          }
        >
          {children}
        </div>
      </section>

      {loaderSlot}
    </>
  );
}
