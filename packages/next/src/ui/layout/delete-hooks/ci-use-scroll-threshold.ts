"use client";

import { useEffect, useState } from "react";

/**
 * Returns true when the scrollable container (window by default) has crossed `threshold` px.
 */
export function useCiScrollThreshold(
  threshold = 64,
  container: HTMLElement | null = null,
) {
  const [past, setPast] = useState(false);

  useEffect(() => {
    const getScrollY = () =>
      container
        ? container.scrollTop
        : window.scrollY || document.scrollingElement?.scrollTop || 0;

    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setPast(getScrollY() > threshold);
          ticking = false;
        });
        ticking = true;
      }
    };

    const target = container ?? window;
    target.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // initialize
    return () => {
      target.removeEventListener("scroll", onScroll as any);
    };
  }, [threshold, container]);

  return past;
}
