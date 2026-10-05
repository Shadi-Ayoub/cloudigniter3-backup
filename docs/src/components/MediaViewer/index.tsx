import React, { useEffect, useId, useRef, useState } from "react";
import { Maximize, Minus, Plus, X } from "lucide-react";
import styles from "./styles.module.css";

type Media = {
  element: HTMLImageElement | SVGSVGElement;
  label: string;
  width: number;
  height: number;
  restoreFocus: boolean;
};
const selector = ".markdown img, .markdown .docusaurus-mermaid-container > svg";

/** One viewer for authored Markdown, ImageWrapper, and asynchronously rendered Mermaid. */
export default function MediaViewer(): React.JSX.Element | null {
  const [media, setMedia] = useState<Media | null>(null);
  const [zoom, setZoom] = useState(1);
  const [frame, setFrame] = useState({ width: 1, height: 1 });
  const dialog = useRef<HTMLDialogElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);
  const titleId = useId();
  const helpId = useId();

  useEffect(() => {
    const originals = new Map<
      Element,
      {
        role: string | null;
        tabindex: string | null;
        label: string | null;
        title: string | null;
      }
    >();
    const enhance = () => {
      document
        .querySelectorAll<HTMLImageElement | SVGSVGElement>(selector)
        .forEach((element) => {
          if (
            originals.has(element) ||
            element.closest('[data-media-zoom="off"]')
          )
            return;
          originals.set(element, {
            role: element.getAttribute("role"),
            tabindex: element.getAttribute("tabindex"),
            label: element.getAttribute("aria-label"),
            title: element.getAttribute("title"),
          });
          element.dataset.mediaZoom = "true";
          element.setAttribute("role", "button");
          element.setAttribute("tabindex", "0");
          const label =
            element instanceof HTMLImageElement
              ? element.alt
              : element.querySelector("title")?.textContent;
          element.setAttribute("aria-label", `Enlarge ${label || "diagram"}`);
          element.setAttribute("title", "Click or press Enter to enlarge");
        });
    };
    const open = (event: MouseEvent | KeyboardEvent) => {
      if (
        event instanceof KeyboardEvent &&
        event.key !== "Enter" &&
        event.key !== " "
      )
        return;
      const element =
        event.target instanceof Element
          ? event.target.closest('[data-media-zoom="true"]')
          : null;
      if (
        !(
          element instanceof HTMLImageElement ||
          element instanceof SVGSVGElement
        )
      )
        return;
      const bounds = element.getBoundingClientRect();
      const width =
        element instanceof HTMLImageElement
          ? element.naturalWidth
          : element.viewBox.baseVal.width || bounds.width;
      const height =
        element instanceof HTMLImageElement
          ? element.naturalHeight
          : element.viewBox.baseVal.height || bounds.height;
      if (!width || !height) return;
      event.preventDefault();
      event.stopPropagation();
      // Transfer focus to the viewer without retaining a pointer-selected image.
      element.blur();
      setZoom(1);
      setMedia({
        element,
        restoreFocus: event instanceof KeyboardEvent || event.detail === 0,
        width,
        height,
        label:
          element instanceof HTMLImageElement
            ? element.alt || "Guide image"
            : element.querySelector("title")?.textContent || "Guide diagram",
      });
    };
    enhance();
    const observer = new MutationObserver(enhance);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", open, true);
    document.addEventListener("keydown", open, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("click", open, true);
      document.removeEventListener("keydown", open, true);
      originals.forEach((attributes, element) => {
        element.removeAttribute("data-media-zoom");
        for (const [key, value] of Object.entries({
          role: attributes.role,
          tabindex: attributes.tabindex,
          "aria-label": attributes.label,
          title: attributes.title,
        })) {
          if (value === null) element.removeAttribute(key);
          else element.setAttribute(key, value);
        }
      });
    };
  }, []);

  useEffect(() => {
    if (!media || !dialog.current || !content.current || !viewport.current)
      return;
    // Clone the rendered SVG to retain diagram styling and vector sharpness at every zoom.
    const clone = media.element.cloneNode(true) as HTMLElement | SVGSVGElement;
    clone.removeAttribute("data-media-zoom");
    clone.removeAttribute("tabindex");
    clone.setAttribute("role", "img");
    clone.setAttribute("aria-label", media.label);
    clone.style.width = "100%";
    clone.style.height = "100%";
    clone.style.maxWidth = "none";
    clone.style.padding = "0";
    clone.style.margin = "0";
    clone.style.display = "block";
    if (clone instanceof HTMLImageElement) {
      clone.src = (media.element as HTMLImageElement).currentSrc;
      clone.removeAttribute("srcset");
      clone.draggable = false;
    }
    content.current.replaceChildren(clone);
    const modal = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modal.showModal();
    const resize = new ResizeObserver(([entry]) => {
      if (entry)
        setFrame({
          width: Math.max(1, entry.contentRect.width - 32),
          height: Math.max(1, entry.contentRect.height - 32),
        });
    });
    resize.observe(viewport.current);
    return () => {
      resize.disconnect();
      modal.close();
      document.body.style.overflow = previousOverflow;
      if (media.restoreFocus && media.element.isConnected)
        media.element.focus({ preventScroll: true });
      else media.element.blur();
    };
  }, [media]);

  if (!media) return null;
  const fit = Math.min(
    frame.width / media.width,
    frame.height / media.height,
    1
  );
  const width = media.width * fit * zoom;
  const height = media.height * fit * zoom;
  const overflowing = width > frame.width || height > frame.height;
  const changeZoom = (next: number) => setZoom(Math.max(1, Math.min(8, next)));
  const close = () => setMedia(null);

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={helpId}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === dialog.current) close();
      }}
      onKeyDown={(event) => {
        if (event.key === "+" || event.key === "=") {
          event.preventDefault();
          changeZoom(zoom + 0.5);
        }
        if (event.key === "-") {
          event.preventDefault();
          changeZoom(zoom - 0.5);
        }
        if (event.key === "0") {
          event.preventDefault();
          changeZoom(1);
        }
      }}
    >
      <div className={styles.shell}>
        <div className={styles.toolbar}>
          <strong id={titleId} className={styles.title}>
            {media.label}
          </strong>
          <div className={styles.controls}>
            <button
              type="button"
              onClick={() => changeZoom(zoom - 0.5)}
              disabled={zoom <= 1}
              aria-label="Zoom out"
              title="Zoom out (-)"
            >
              <Minus size={20} />
            </button>
            <output aria-live="polite" className={styles.zoom}>
              {Math.round(zoom * 100)}%
            </output>
            <button
              type="button"
              onClick={() => changeZoom(zoom + 0.5)}
              disabled={zoom >= 8}
              aria-label="Zoom in"
              title="Zoom in (+)"
            >
              <Plus size={20} />
            </button>
            <button
              type="button"
              onClick={() => changeZoom(1)}
              aria-label="Fit to frame"
              title="Fit to frame (0)"
            >
              <Maximize size={20} />
            </button>
            <button
              type="button"
              onClick={close}
              aria-label="Close image viewer"
              title="Close (Escape)"
              autoFocus
            >
              <X size={22} />
            </button>
          </div>
        </div>
        <div
          ref={viewport}
          className={styles.viewport}
          data-pannable={overflowing}
          tabIndex={0}
          role="region"
          aria-label="Zoomed image; use arrow keys to pan"
          onKeyDown={(event) => {
            const delta: Record<string, [number, number]> = {
              ArrowLeft: [-80, 0],
              ArrowRight: [80, 0],
              ArrowUp: [0, -80],
              ArrowDown: [0, 80],
            };
            if (delta[event.key]) {
              event.preventDefault();
              event.currentTarget.scrollBy(...delta[event.key]);
            }
          }}
          onPointerDown={(event) => {
            if (!overflowing || event.button !== 0) return;
            drag.current = {
              x: event.clientX,
              y: event.clientY,
              left: event.currentTarget.scrollLeft,
              top: event.currentTarget.scrollTop,
            };
            event.currentTarget.setPointerCapture(event.pointerId);
            event.currentTarget.dataset.dragging = "true";
            event.currentTarget.focus();
          }}
          onPointerMove={(event) => {
            if (!drag.current) return;
            event.currentTarget.scrollLeft =
              drag.current.left - event.clientX + drag.current.x;
            event.currentTarget.scrollTop =
              drag.current.top - event.clientY + drag.current.y;
          }}
          onPointerUp={(event) => {
            drag.current = null;
            delete event.currentTarget.dataset.dragging;
          }}
          onPointerCancel={(event) => {
            drag.current = null;
            delete event.currentTarget.dataset.dragging;
          }}
          onLostPointerCapture={(event) => {
            drag.current = null;
            delete event.currentTarget.dataset.dragging;
          }}
        >
          <div
            className={styles.canvas}
            style={{ minWidth: width + 32, minHeight: height + 32 }}
          >
            <div
              ref={content}
              className={styles.media}
              style={{ width, height }}
            />
          </div>
        </div>
        <p id={helpId} className={styles.help}>
          Zoom with + / −. Drag or use arrow keys to pan. Press 0 to fit, Escape
          to close.
        </p>
      </div>
    </dialog>
  );
}
