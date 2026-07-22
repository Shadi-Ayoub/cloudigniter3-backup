"use client";

import {
  cloneElement,
  isValidElement,
  useEffect,
  useState,
  type ReactElement,
} from "react";
import type { CiCollapsiblePageHeaderProps } from "@cloudigniter/core/types";

export function CiPageHeader({
  title,
  subtitle,
  icon,
  actions,
  scrollContainerRef,
  threshold = 64,
}: CiCollapsiblePageHeaderProps) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const enterThreshold = threshold + 8;
    const exitThreshold = threshold - 8;

    let ticking = false;
    let lastCompact = false;

    const update = () => {
      const nextCompact = lastCompact
        ? container.scrollTop > exitThreshold
        : container.scrollTop > enterThreshold;

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

    lastCompact = container.scrollTop > enterThreshold;
    setCompact(lastCompact);

    return () => container.removeEventListener("scroll", onScroll);
  }, [scrollContainerRef, threshold]);

  const renderedIcon = (() => {
    if (!icon) return null;

    if (isValidElement(icon)) {
      const element = icon as ReactElement<any, any>;
      const existingClassName = element.props?.className ?? "";
      const existingStyle = element.props?.style ?? {};
      const sizeClasses = compact
        ? "ci-page-header-icon-size-compact"
        : "ci-page-header-icon-size-normal";

      return cloneElement(element, {
        className:
          `${sizeClasses} ci-page-header-icon ${existingClassName}`.trim(),
        style: {
          ...existingStyle,
          fontSize: compact ? 16 : 24,
        },
        "aria-hidden": true,
      });
    }

    return icon;
  })();

  return (
    <div
      className="ci-page-header-main"
      {...(compact ? { "data-compact": "true" } : {})}
    >
      {renderedIcon ? <div id="page-header-icon">{renderedIcon}</div> : null}

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

        {subtitle ? (
          <p
            className={`ci-page-header-subtitle ${
              compact
                ? "ci-page-header-subtitle-compact"
                : "ci-page-header-subtitle-normal"
            }`}
          >
            {subtitle}
          </p>
        ) : null}
      </div>

      <div className="ci-page-header-middle-separator" />

      {actions ? (
        <div
          className={`ci-page-header-actions ${
            compact
              ? "ci-page-header-actions-compact"
              : "ci-page-header-actions-normal"
          }`}
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}
