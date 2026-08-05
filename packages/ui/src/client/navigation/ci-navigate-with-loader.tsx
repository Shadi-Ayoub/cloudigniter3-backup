"use client";

import type { MouseEvent, PropsWithChildren } from "react";

export interface CiNavigateWithLoaderProps extends PropsWithChildren {
  href: string;
  className?: string;

  /**
   * Whether to refresh the current route after navigation.
   */
  refresh?: boolean;

  /**
   * Whether to remove focus from the link before navigating.
   */
  removeFocus?: boolean;

  /**
   * Optional target used for external links.
   *
   * Defaults to "_blank" for external URLs.
   */
  externalTarget?: "_blank" | "_self" | "_parent" | "_top";

  /**
   * Called immediately before internal navigation begins.
   *
   * This can be used to display a page loader.
   */
  onNavigateStart?: (href: string) => void;

  /**
   * Performs client-side navigation.
   *
   * When omitted, the component falls back to
   * window.location.assign().
   */
  navigate?: (href: string) => void | Promise<void>;

  /**
   * Refreshes the current route after navigation.
   *
   * When omitted, the component falls back to
   * window.location.reload().
   */
  refreshRoute?: () => void | Promise<void>;
}

/**
 * Detect whether a URL is external or uses a non-HTTP navigation protocol.
 */
function ciIsExternalHref(href: string): boolean {
  return (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("//") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  );
}

/**
 * Determine whether a click should use the browser's native behavior.
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
 * Navigation component with loader support for internal routes,
 * and native behavior for external links.
 *
 * Framework-specific navigation can be supplied through the
 * `navigate` and `refreshRoute` props.
 */
export function CiNavigateWithLoader({
  href,
  className,
  refresh = false,
  removeFocus = true,
  externalTarget = "_blank",
  onNavigateStart,
  navigate,
  refreshRoute,
  children,
}: CiNavigateWithLoaderProps) {
  const isExternal = ciIsExternalHref(href);

  async function ciHandleNavigate(event: MouseEvent<HTMLAnchorElement>) {
    /**
     * Always allow default behavior for:
     * - external links
     * - modified clicks
     * - non-primary mouse-button clicks
     */
    if (isExternal || ciShouldUseNativeNavigation(event)) {
      return;
    }

    event.preventDefault();

    if (removeFocus) {
      event.currentTarget.blur();
    }

    onNavigateStart?.(href);

    if (navigate) {
      await navigate(href);

      if (refresh) {
        if (refreshRoute) {
          await refreshRoute();
        } else if (typeof window !== "undefined") {
          window.location.reload();
        }
      }

      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    /**
     * A full-page navigation already refreshes the document, so an
     * additional refresh is unnecessary when no client router is supplied.
     */
    window.location.assign(href);
  }

  /**
   * External links:
   * - use native anchor navigation
   * - do not trigger the loader
   * - do not intercept the click
   */
  if (isExternal) {
    return (
      <a
        href={href}
        className={className}
        target={externalTarget}
        rel={externalTarget === "_blank" ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    );
  }

  /**
   * Internal links:
   * - use a semantic native anchor
   * - optionally delegate navigation to a framework adapter
   */
  return (
    <a href={href} onClick={ciHandleNavigate} className={className}>
      {children}
    </a>
  );
}
