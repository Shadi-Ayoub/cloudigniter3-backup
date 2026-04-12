"use client";

import {
  cloneElement,
  isValidElement,
  useEffect,
  useState,
  type ReactElement,
} from "react";
import { ciStartTrace } from "@cloudigniter/core";
import type { CiCollapsiblePageHeaderProps } from "../types";

export function CiPageHeader({
  config,
  title,
  subtitle,
  icon,
  actions,
  scrollContainerRef,
  threshold = 64,
}: CiCollapsiblePageHeaderProps) {
  const [compact, setCompact] = useState(false);

  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger, done } = ciStartTrace(config?.ciConfig.traceLog, {
    source: "client",
  });

  // log mount/unmount once
  useEffect(() => {
    // stop the render timer (records a "duration" metric if enabled)
    done({ phase: "mount" });

    logger.log({ type: "ui", event: "mount <PageHeader>" });
    return () => logger.log({ type: "ui", event: "unmount" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /////////////////////////////////////////////////////////////////////////////////////////

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Hysteresis band around the threshold
    const ENTER = threshold + 8; // enter compact after passing threshold + 8px
    const EXIT = threshold - 8; // leave compact only after going below threshold - 8px

    let ticking = false;
    let lastCompact = false;

    const update = () => {
      const y = container.scrollTop;
      const nextCompact = lastCompact ? y > EXIT : y > ENTER;
      if (nextCompact !== lastCompact) {
        lastCompact = nextCompact;
        setCompact(nextCompact);
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    container.addEventListener("scroll", onScroll, { passive: true });

    // initialize once
    (function init() {
      const y = container.scrollTop;
      lastCompact = y > ENTER;
      setCompact(lastCompact);
    })();

    return () => container.removeEventListener("scroll", onScroll);
  }, [scrollContainerRef, threshold]);

  const renderedIcon = (() => {
    if (!icon) return null;

    if (isValidElement(icon)) {
      const element = icon as ReactElement<any, any>;
      // grab existing className/style defensively
      const existingClassName = (element.props as any).className ?? "";
      const existingStyle = (element.props as any).style ?? {};

      const sizeClasses = compact
        ? "ci-page-header-icon-size-compact"
        : "ci-page-header-icon-size-normal";
      const fontSize = compact ? 16 : 24; // for icon sets that use fontSize

      return cloneElement(element, {
        className:
          `${sizeClasses} ci-page-header-icon ${existingClassName}`.trim(),
        style: {
          ...existingStyle,
          fontSize,
        },
        "aria-hidden": true,
      });
    }

    // not a React element (string, fragment, etc.), just render as-is
    return icon;
  })();

  return (
    <>
      {/* Fixed header beneath the primary layout header */}
      <div
        className="ci-page-header-main"
        {...(compact ? { "data-compact": "true" } : {})}
      >
        {renderedIcon && <div id="page-header-icon">{renderedIcon}</div>}

        <div className="ci-page-header-box">
          <h1
            className={`ci-page-header-title ${
              compact
                ? "ci-page-header-title-compact"
                : "ci-page-header-title-normal"
            }`}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className={`ci-page-header-subtitle ${
                compact
                  ? "ci-page-header-subtitle-compact"
                  : "ci-page-header-subtitle-normal"
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>

        <div className="ci-page-header-middle-separator" />

        {actions && (
          <div
            className={`ci-page-header-actions ${
              compact
                ? "ci-page-header-actions-compact"
                : "ci-page-header-actions-normal"
            }`}
          >
            {actions}
          </div>
        )}
      </div>
    </>
  );
}
