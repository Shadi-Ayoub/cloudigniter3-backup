"use client";

import { useEffect, type MouseEvent } from "react";
import type { CiHeaderLogoProps } from "./types";

/**
 * Determine whether the browser should retain its native click behavior.
 */
function ciShouldUseNativeNavigation(
  event: MouseEvent<HTMLAnchorElement>,
): boolean {
  return (
    event.defaultPrevented ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  );
}

/**
 * Framework-agnostic CloudIgniter header logo.
 */
export function CiHeaderLogo({
  href = "/",
  className = "ci-header-logo-main",
  onNavigateStart,
  navigate,
  refreshRoute,
  refresh = false,
  onMount,
  onUnmount,
  children,
}: CiHeaderLogoProps) {
  useEffect(() => {
    onMount?.();

    return () => {
      onUnmount?.();
    };
  }, [onMount, onUnmount]);

  async function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (ciShouldUseNativeNavigation(event)) {
      return;
    }

    /**
     * Preserve normal anchor navigation when no client-side router
     * implementation has been supplied.
     */
    if (!navigate) {
      onNavigateStart?.(href);
      return;
    }

    event.preventDefault();

    onNavigateStart?.(href);

    await navigate(href);

    if (refresh && refreshRoute) {
      await refreshRoute();
    }
  }

  return (
    <a href={href} onClick={handleClick} className={className} dir="ltr">
      {children ?? (
        <>
          <span className="ci-header-logo-cloud">Cloud</span>
          <span className="ci-header-logo-igniter">Igniter</span>
          <span className="ci-header-logo-flame" />
        </>
      )}
    </a>
  );
}
