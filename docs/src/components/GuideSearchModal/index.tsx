import { useCompanyDocs } from "../../utils/docs-edition";
import React, {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import { useLocation } from "@docusaurus/router";
import { ArrowRight, FileText, Search, X } from "lucide-react";
import {
  searchDocuments,
  searchExcerpt,
  searchScopes,
  type SearchDocument,
  type SearchScope,
} from "../../utils/guide-search";
import Highlight from "../SearchHighlight";
import { GUIDE_SEARCH_OPEN_EVENT } from "./events";
import styles from "./styles.module.css";

export default function GuideSearchModal(): React.JSX.Element {
  const companyDocs = useCompanyDocs();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const searchUrl = useBaseUrl("/search");
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<SearchScope>("all");
  const [documents, setDocuments] = useState<SearchDocument[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const deferredQuery = useDeferredValue(query);
  const results = useMemo(
    () => searchDocuments(documents ?? [], deferredQuery, scope),
    [documents, deferredQuery, scope],
  );
  const visibleResults = results.slice(0, 20);
  const activeResultId = visibleResults[activeIndex]
    ? `guide-search-result-${activeIndex}`
    : undefined;
  const fullResultsUrl = `${searchUrl}?${new URLSearchParams({ q: query, scope })}`;

  useEffect(() => {
    function open() {
      if (!document.querySelector("dialog[open]")) setIsOpen(true);
    }
    function shortcut(event: KeyboardEvent) {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k" &&
        !event.altKey &&
        !event.isComposing &&
        !event.repeat
      ) {
        const otherDialog = document.querySelector("dialog[open]");
        if (otherDialog && otherDialog !== dialogRef.current) return;
        event.preventDefault();
        setIsOpen((current) => !current);
      }
    }
    window.addEventListener(GUIDE_SEARCH_OPEN_EVENT, open);
    window.addEventListener("keydown", shortcut);
    return () => {
      window.removeEventListener(GUIDE_SEARCH_OPEN_EVENT, open);
      window.removeEventListener("keydown", shortcut);
    };
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;
    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    inputRef.current?.select();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || documents) return;
    let cancelled = false;
    setLoadError(false);
    import("@generated/cloudigniter-guide-search/default/search-index.json")
      .then(({ default: index }) => {
        if (!cancelled) setDocuments(index);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, documents, retry]);

  useEffect(() => {
    setActiveIndex(0);
  }, [deferredQuery, scope]);
  useEffect(() => {
    if (isOpen && activeResultId) {
      document
        .getElementById(activeResultId)
        ?.scrollIntoView({ block: "nearest" });
    }
  }, [isOpen, activeResultId, deferredQuery, scope]);

  return (
    <dialog
      id="guide-search-dialog"
      ref={dialogRef}
      className={styles.dialog}
      aria-label="Search guides"
      onCancel={(event) => {
        event.preventDefault();
        setIsOpen(false);
      }}
      onClose={() => setIsOpen(false)}
      onClick={(event) => {
        if (event.target === event.currentTarget) setIsOpen(false);
      }}
      onKeyDown={(event) => {
        // Close even when a browser would otherwise consume Escape in the input.
        if (event.key === "Escape") {
          event.preventDefault();
          setIsOpen(false);
        }
        if (event.key === "Tab") {
          // Keep Tab cycling in the search controls, including at browser-chrome boundaries.
          const controls = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              "input, select, button, a[href]",
            ),
          ).filter(
            (element) =>
              element.tabIndex >= 0 &&
              !element.hasAttribute("disabled") &&
              element.getClientRects().length > 0,
          );
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }
      }}
    >
      <div className={styles.shell}>
        <div className={styles.searchRow}>
          <Search size={21} aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-label="Search documentation"
            aria-autocomplete="list"
            aria-expanded={visibleResults.length > 0}
            aria-controls="guide-search-results"
            aria-activedescendant={activeResultId}
            autoComplete="off"
            spellCheck={false}
            placeholder="Search the guides…"
            value={query}
            maxLength={200}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return;
              if (
                visibleResults.length &&
                (event.key === "ArrowDown" || event.key === "ArrowUp")
              ) {
                event.preventDefault();
                setActiveIndex(
                  (current) =>
                    (current +
                      (event.key === "ArrowDown" ? 1 : -1) +
                      visibleResults.length) %
                    visibleResults.length,
                );
              } else if (event.key === "Enter" && activeResultId) {
                event.preventDefault();
                document.getElementById(activeResultId)?.click();
              }
            }}
          />
          <button
            type="button"
            className={styles.close}
            aria-label="Close search"
            onClick={() => setIsOpen(false)}
          >
            <X size={19} aria-hidden="true" />
          </button>
        </div>
        <div className={styles.toolbar}>
          <label className={styles.scope}>
            <span>Search in</span>
            <select
              value={scope}
              onChange={(event) => setScope(event.target.value as SearchScope)}
            >
              {Object.entries(searchScopes).filter(([key]) => companyDocs || !["developers", "dev", "skills", "commands"].includes(key)).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <span className={styles.count} role="status">
            {query.trim() && documents
              ? `${results.length} ${results.length === 1 ? "result" : "results"}`
              : ""}
          </span>
        </div>
        <div
          className={styles.body}
          aria-busy={isOpen && !documents && !loadError}
        >
          {loadError ? (
            <div className={styles.empty} role="alert">
              <strong>Search couldn’t load</strong>
              <p>Check your connection and try again.</p>
              <button
                type="button"
                onClick={() => setRetry((current) => current + 1)}
              >
                Try again
              </button>
            </div>
          ) : !documents ? (
            <div className={styles.empty} role="status">
              Loading search…
            </div>
          ) : !query.trim() ? (
            <div className={styles.empty}>
              <Search size={28} aria-hidden="true" />
              <strong>What are you looking for?</strong>
              <p>Search for a command, API, or topic.</p>
              <span>
                Try{" "}
                <button
                  type="button"
                  className={styles.example}
                  onClick={() => {
                    setQuery("ci modules validate");
                    inputRef.current?.focus();
                  }}
                >
                  ci modules validate
                </button>{" "}
                or tenant routing.
              </span>
            </div>
          ) : !results.length ? (
            <div className={styles.empty}>
              <strong>No matching documents</strong>
              <p>
                Try fewer words, check the spelling, or search in all guides.
              </p>
              {scope !== "all" && (
                <button type="button" onClick={() => setScope("all")}>
                  Search all guides
                </button>
              )}
            </div>
          ) : null}
          <div
            id="guide-search-results"
            role="listbox"
            aria-label="Search results"
            className={styles.results}
          >
            {visibleResults.map((doc, index) => (
              <Link
                id={`guide-search-result-${index}`}
                key={doc.url}
                role="option"
                aria-selected={index === activeIndex}
                tabIndex={-1}
                to={doc.url}
                onMouseMove={() => setActiveIndex(index)}
                onClick={(event) => {
                  if (
                    !event.metaKey &&
                    !event.ctrlKey &&
                    !event.shiftKey &&
                    !event.altKey &&
                    event.button === 0
                  )
                    setIsOpen(false);
                }}
                className={styles.result}
              >
                <FileText
                  size={18}
                  aria-hidden="true"
                  className={styles.resultIcon}
                />
                <span className={styles.resultText}>
                  <span className={styles.resultScope}>
                    {searchScopes[doc.scope]}
                  </span>
                  <strong>
                    <Highlight text={doc.title} query={deferredQuery} />
                  </strong>
                  <span className={styles.excerpt}>
                    <Highlight
                      text={searchExcerpt(doc, deferredQuery)}
                      query={deferredQuery}
                    />
                  </span>
                </span>
                <ArrowRight
                  size={16}
                  aria-hidden="true"
                  className={styles.resultArrow}
                />
              </Link>
            ))}
          </div>
          {results.length > 0 && (
            <Link
              className={styles.viewAll}
              to={fullResultsUrl}
              onClick={() => setIsOpen(false)}
            >
              View all {results.length} results{" "}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          )}
        </div>
        <footer className={styles.footer}>
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> navigate
          </span>
          <span>
            <kbd>↵</kbd> open
          </span>
          <span>
            <kbd>esc</kbd> close
          </span>
        </footer>
      </div>
    </dialog>
  );
}
