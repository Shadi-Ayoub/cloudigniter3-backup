import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "@docusaurus/router";
import { translate } from "@docusaurus/Translate";
import { useDocsSidebar } from "@docusaurus/plugin-content-docs/client";
import DocSidebarItems from "@theme/DocSidebarItems";
import DocRootLayoutMain from "@theme/DocRoot/Layout/Main";
import BackToTopButton from "@theme/BackToTopButton";
import { Maximize, Minimize, PanelLeft, X } from "lucide-react";
import type { Props } from "@theme/DocRoot/Layout";
import type { PropSidebarItem } from "@docusaurus/plugin-content-docs";
import styles from "./styles.module.css";

function measureItems(items: PropSidebarItem[], level = 0, prefix = "item"): React.ReactNode[] {
  return items.flatMap((item, index) => [
    <span key={`${prefix}-${index}`} style={{ paddingInlineStart: `${level * 1.3}rem` }}>
      {item.type === "html" ? "" : item.label}
    </span>,
    ...(item.type === "category" ? measureItems(item.items, level + 1, `${prefix}-${index}`) : []),
  ]);
}

export default function DocRootLayout({ children }: Props): React.JSX.Element {
  const sidebar = useDocsSidebar();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const fullscreenRef = useRef<HTMLButtonElement>(null);
  const readingPositionRef = useRef(0);
  const pathnameRef = useRef(pathname);

  function closeDrawer(restoreFocus = true) {
    setOpen(false);
    if (restoreFocus) toggleRef.current?.focus({ preventScroll: true });
  }

  async function exitFullscreen() {
    if (document.fullscreenElement === rootRef.current) await document.exitFullscreen();
    setFullscreen(false);
    fullscreenRef.current?.focus({ preventScroll: true });
  }

  async function toggleFullscreen() {
    closeDrawer(false);
    if (fullscreen) return exitFullscreen();
    readingPositionRef.current = window.scrollY;
    // CSS reading mode also works in browsers without element fullscreen support.
    setFullscreen(true);
    try { await rootRef.current?.requestFullscreen?.(); } catch { /* Keep reading mode. */ }
  }

  useEffect(() => {
    pathnameRef.current = pathname;
    setOpen(false);
    setShowBackToTop(false);
    readingPositionRef.current = 0;
    // The layout stays mounted between pages, so keep the reader's view mode.
    rootRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  useEffect(() => {
    if (drawerRef.current) drawerRef.current.inert = !open;
    if (open) drawerRef.current?.querySelector<HTMLElement>("a, button")?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    function onEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || document.querySelector("dialog[open]")) return;
      if (open) { event.preventDefault(); closeDrawer(); }
      else if (fullscreen) { event.preventDefault(); void exitFullscreen(); }
    }
    function onFullscreenChange() {
      if (!document.fullscreenElement) {
        setFullscreen(false);
        fullscreenRef.current?.focus({ preventScroll: true });
      }
    }
    document.addEventListener("keydown", onEscape);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [open, fullscreen]);

  useEffect(() => {
    if (!fullscreen) return;
    const overflow = document.documentElement.style.overflow;
    const outside: { element: HTMLElement; inert: boolean }[] = [];
    let branch: HTMLElement | null = rootRef.current;
    while (branch?.parentElement) {
      for (const sibling of Array.from(branch.parentElement.children)) {
        if (sibling !== branch && sibling instanceof HTMLElement && sibling.tagName !== "DIALOG") {
          outside.push({ element: sibling, inert: sibling.inert });
          sibling.inert = true;
        }
      }
      branch = branch.parentElement;
      if (branch === document.body) break;
    }
    document.documentElement.style.overflow = "hidden";
    if (rootRef.current) rootRef.current.scrollTop = readingPositionRef.current;
    setShowBackToTop(readingPositionRef.current > 300);
    return () => {
      const readingPosition = readingPositionRef.current;
      const readingPathname = pathnameRef.current;
      document.documentElement.style.overflow = overflow;
      outside.forEach(({ element, inert }) => { element.inert = inert; });
      // Wait for the article to return to document flow before restoring its position.
      requestAnimationFrame(() => {
        if (window.location.pathname === readingPathname) window.scrollTo({ top: readingPosition, behavior: "instant" });
      });
    };
  }, [fullscreen]);

  return (
    <div ref={rootRef} className={`${styles.root} ${fullscreen ? styles.fullscreen : ""}`}
      onScroll={(event) => {
        if (fullscreen) {
          readingPositionRef.current = event.currentTarget.scrollTop;
          setShowBackToTop(event.currentTarget.scrollTop > 300);
          // Docusaurus highlights ToC entries on document scroll; reading mode scrolls this container.
          document.dispatchEvent(new Event("scroll"));
        }
      }}>
      <div className={styles.controls} aria-label="Reading controls">
        {sidebar && <button ref={toggleRef} type="button" aria-controls="guide-navigation"
          aria-expanded={open} onClick={() => open ? closeDrawer() : setOpen(true)}>
          {open ? <X size={18} aria-hidden="true" /> : <PanelLeft size={18} aria-hidden="true" />}
          <span>{open ? "Close navigation" : "Navigation"}</span>
        </button>}
        <button ref={fullscreenRef} type="button" aria-pressed={fullscreen}
          onClick={() => void toggleFullscreen()} title={fullscreen ? "Exit full screen (Escape)" : "Read in full screen"}>
          {fullscreen ? <Minimize size={18} aria-hidden="true" /> : <Maximize size={18} aria-hidden="true" />}
          <span>{fullscreen ? "Exit full screen" : "Full screen"}</span>
        </button>
      </div>
      {sidebar && <>
        {open && <div className={styles.backdrop} onClick={() => closeDrawer()} aria-hidden="true" />}
        <aside ref={drawerRef} id="guide-navigation" aria-label="Guide navigation" aria-hidden={!open}
          className={`${styles.drawer} ${open ? styles.drawerOpen : ""}`}
          onClick={(event) => {
            if (event.target instanceof Element && event.target.closest("a[href]")) closeDrawer();
          }}
          onBlur={(event) => {
            if (open && event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)
              && !toggleRef.current?.contains(event.relatedTarget)) closeDrawer(false);
          }}>
          <div className={styles.sizer} aria-hidden="true">{measureItems(sidebar.items)}</div>
          <nav className="menu thin-scrollbar" aria-label="Tutorials">
            <ul className="theme-doc-sidebar-menu menu__list">
              <DocSidebarItems items={sidebar.items} activePath={pathname} level={1} />
            </ul>
          </nav>
        </aside>
      </>}
      {fullscreen ? <button
        type="button"
        aria-label={translate({
          id: "theme.BackToTopButton.buttonAriaLabel",
          message: "Scroll back to top",
          description: "The ARIA label for the back to top button",
        })}
        className={`clean-btn theme-back-to-top-button ${styles.backToTop} ${showBackToTop ? styles.backToTopVisible : ""}`}
        onClick={() => {
          // Reading mode scrolls the container, rather than the document.
          rootRef.current?.scrollTo({
            top: 0,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
          });
          (toggleRef.current ?? fullscreenRef.current)?.focus({ preventScroll: true });
        }}
      /> : <BackToTopButton />}
      <DocRootLayoutMain hiddenSidebarContainer>{children}</DocRootLayoutMain>
    </div>
  );
}
