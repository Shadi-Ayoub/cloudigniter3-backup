"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCiPageLoaderStore } from "@cloudigniter/core/client";
import type { CiNavigateWithLoaderProps } from "@ci-next/types";

/**
 * Detect whether a URL is external.
 */
function ciIsExternalHref(href: string): boolean {
  return (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  );
}

/**
 * Navigation component with loader support for internal routes,
 * and native behavior for external links.
 */
export function CiNavigateWithLoader({
  href,
  className,
  refresh = false,
  removeFocus = true,
  children,
}: CiNavigateWithLoaderProps) {
  const router = useRouter();
  const { setLoading } = useCiPageLoaderStore();

  const ciIsExternal = ciIsExternalHref(href);

  function ciHandleNavigate(e: MouseEvent<HTMLAnchorElement>) {
    /**
     * Always allow default behavior for:
     * - external links
     * - modified clicks (new tab, etc.)
     */
    if (
      ciIsExternal ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      e.button !== 0
    ) {
      return;
    }

    e.preventDefault();

    if (removeFocus) {
      e.currentTarget.blur();
    }

    setLoading(true);
    router.push(href);

    if (refresh) {
      router.refresh();
    }
  }

  /**
   * External links:
   * - use plain <a>
   * - no router interception
   */
  if (ciIsExternal) {
    return (
      <a
        href={href}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }

  /**
   * Internal links:
   * - use Next <Link>
   * - intercept click to trigger loader
   */
  return (
    <Link href={href} onClick={ciHandleNavigate} className={className}>
      {children}
    </Link>
  );
}
