"use client";

import * as React from "react";

import { useCiPageLoaderStore } from "@cloudigniter/core/client";
import type { CiAuthenticatorConfig } from "@/auth";

/**
 * Options controlling how aggressively we decide that the Authenticator UI
 * has “disappeared” from the page.
 */
export type UseDisappearLoaderOptions = {
  /**
   * Minimum height threshold for the container to be considered “present”.
   *
   * - If the container’s rendered height is <= this value, we treat it as “gone”.
   * - This protects against transient 0-height / collapsed states during layout
   *   transitions (e.g., Authenticator unmounting between steps).
   *
   * Default: 16px (small but non-zero to avoid false positives).
   */
  minHeightPx?: number;

  /**
   * Debounce delay (ms) applied to the disappearance check.
   *
   * - DOM mutations and resize events can fire many times during a single UI update.
   * - Debouncing reduces flicker and avoids redundant checks.
   *
   * Guidance:
   * - If you have CSS animations/height transitions, use a small debounce (e.g. 30–80ms)
   *   to avoid false disappearance triggers during animation frames.
   *
   * Default: 0 (run checks immediately).
   */
  debounceMs?: number;

  /**
   * Suppress the “Signing in…” message during initial mount/hydration.
   *
   * Why:
   * - On hard refresh, Authenticator can briefly render:
   *   empty → visible → empty (layout/hydration jitter).
   * - Without suppression, you might see both:
   *   “Loading…” then “Signing in…” even before the user submits.
   *
   * Default: 1200ms.
   */
  initialMountSuppressMs?: number;

  /**
   * Require the Authenticator to be visible for at least this long before we
   * allow “Signing in…” message (prevents rapid visible/hidden jitter from
   * being misclassified as sign-in).
   *
   * Default: 300ms.
   */
  minVisibleStableMs?: number;
};

/**
 * useShowLoaderWhenAuthenticatorDisappears
 *
 * Purpose
 * -------
 * Detect transient “white flashes” where the Authenticator UI briefly disappears
 * (empty/collapsed wrapper) before redirects or before other loader mechanisms
 * activate. When disappearance is detected, we switch on the global PageLoader.
 *
 * Additionally, we support two loader texts:
 * - Initial page load text (e.g., “Loading… Please wait.”)
 * - Sign-in / redirect text (e.g., “Signing you in… Please wait.”)
 *
 * We decide which text to display using DOM heuristics:
 * - If the Authenticator has never been visible on this page: use initial-load text.
 * - If it has been visible and we’re past initial hydration jitter: use signing-in text.
 *
 * Note
 * ----
 * This is a DOM-based heuristic, not an auth-state detector. It does NOT mean “user clicked sign in”;
 * it means “the Authenticator UI vanished from the DOM/viewport”.
 *
 * Usage
 * -----
 * const authUiRef = React.useRef<HTMLDivElement>(null);
 * useShowLoaderWhenAuthenticatorDisappears(authUiRef, { debounceMs: 50 }, ciConfig);
 *
 * return <div ref={authUiRef}><Authenticator ... /></div>
 */
export function useShowLoaderWhenAuthenticatorDisappears(
  containerRef: React.RefObject<HTMLElement | null>,
  opts: UseDisappearLoaderOptions = {},
  ciConfig: CiAuthenticatorConfig,
) {
  const {
    minHeightPx = 16,
    debounceMs = 0,
    initialMountSuppressMs = 1200,
    minVisibleStableMs = 300,
  } = opts;

  /**
   * Zustand action that toggles the global page loader.
   * Assumption based on your usage: setLoading(loading: boolean, text?: string)
   */
  const setLoading = useCiPageLoaderStore((s) => s.setLoading);

  /** Holds a timer id for debouncing `check()` calls. */
  const timerRef = React.useRef<number | null>(null);

  /**
   * Tracks whether the Authenticator UI has *ever* been visible on this page.
   * - Used to distinguish “initial page load” vs “later disappearance”.
   */
  const hasEverBeenVisibleRef = React.useRef(false);

  /**
   * Timestamp when the hook mounted (used to suppress “signing in” text during hydration).
   */
  const mountedAtRef = React.useRef<number>(Date.now());

  /**
   * First time the Authenticator became visible (used to require stable visibility).
   */
  const firstVisibleAtRef = React.useRef<number | null>(null);

  /**
   * Avoid text thrash: track which message label we last triggered.
   */
  const lastTriggeredLabelRef = React.useRef<"initial" | "signin" | null>(null);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    /**
     * Determine if the wrapper currently has “meaningful” visible UI.
     * This is intentionally conservative:
     * - must have height
     * - and must contain at least one visible descendant node
     */
    const isVisibleNow = (): boolean => {
      const rect = el.getBoundingClientRect();
      const hasMeaningfulHeight = rect.height > minHeightPx;

      if (!hasMeaningfulHeight) return false;

      // Must have at least one visible descendant (width/height > 0).
      const hasVisibleChild = Array.from(el.querySelectorAll("*")).some((n) => {
        const r = (n as HTMLElement).getBoundingClientRect?.();
        return !!r && r.width > 0 && r.height > 0;
      });

      return hasVisibleChild;
    };

    const check = () => {
      const now = Date.now();
      const visible = isVisibleNow();

      // If visible at least once, mark it and capture the first visible timestamp.
      if (visible) {
        hasEverBeenVisibleRef.current = true;
        if (firstVisibleAtRef.current == null) firstVisibleAtRef.current = now;
        return;
      }

      // Not visible now => "disappeared" condition.
      // We only act to turn loader ON; turning it OFF is handled elsewhere.
      const disappeared = true;

      if (!disappeared) return;

      const initialLoadText = "Loading...";
      const signingInText =
        ciConfig.custom?.signinSpinnereText ?? "Signing you in. Please wait.";

      const sinceMountMs = now - mountedAtRef.current;
      const visibleStableMs =
        firstVisibleAtRef.current == null ? 0 : now - firstVisibleAtRef.current;

      /**
       * Only allow the "Signing in..." message if:
       * 1) The Authenticator has been visible at least once (user saw it),
       * 2) We are past the initial mount/hydration jitter window,
       * 3) It remained visible for a minimum stable period.
       *
       * Otherwise, use the initial-load message.
       */
      const shouldUseSignInText =
        hasEverBeenVisibleRef.current &&
        sinceMountMs > initialMountSuppressMs &&
        visibleStableMs > minVisibleStableMs;

      const nextLabel: "initial" | "signin" = shouldUseSignInText
        ? "signin"
        : "initial";

      // Avoid message thrash: if we already set this label, keep loader on without changing text.
      if (lastTriggeredLabelRef.current === nextLabel) {
        setLoading(true);
        return;
      }

      lastTriggeredLabelRef.current = nextLabel;
      setLoading(true, shouldUseSignInText ? signingInText : initialLoadText);
    };

    const run = () => {
      if (debounceMs <= 0) {
        check();
        return;
      }

      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(check, debounceMs);
    };

    // Initial check (covers first paint / initial collapse state).
    run();

    // Watch DOM mutations inside the wrapper (nodes added/removed, attributes toggled).
    const observer = new MutationObserver(run);
    observer.observe(el, { childList: true, subtree: true, attributes: true });

    // Watch layout changes that might not mutate DOM (height collapse/expand).
    const ro = new ResizeObserver(run);
    ro.observe(el);

    return () => {
      observer.disconnect();
      ro.disconnect();
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [
    containerRef,
    minHeightPx,
    debounceMs,
    initialMountSuppressMs,
    minVisibleStableMs,
    setLoading,
    ciConfig,
  ]);
}
