import type {
  ComponentType,
  LazyExoticComponent,
  MouseEvent as ReactMouseEvent,
} from "react";
import React, {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { BookOpen, ExternalLink, Search, X } from "lucide-react";
import dictionarySidebars from "../../../dictionary-sidebars";
import { DICTIONARY_VIEWER_OPEN_EVENT } from "./events";
import styles from "./styles.module.css";

type DictionaryLetter =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "K"
  | "L"
  | "M"
  | "N"
  | "O"
  | "P"
  | "R"
  | "S"
  | "T"
  | "U";

type DictionarySidebarCategory = {
  items: Array<{ href: string; label: string; type: "link" }>;
  label: DictionaryLetter;
  type: "category";
};

type DictionaryTerm = {
  anchor: string;
  label: string;
  letter: DictionaryLetter;
};

type DictionarySelection = DictionaryTerm | null;

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const dictionaryTermsByLetter = Object.fromEntries(
  (
    dictionarySidebars.dictionarySidebar as unknown as Array<
      DictionarySidebarCategory | string
    >
  )
    .filter(
      (item): item is DictionarySidebarCategory =>
        typeof item !== "string" && item.type === "category",
    )
    .map((category) => [
      category.label,
      category.items.map((item) => [
        item.label,
        item.href.slice(item.href.indexOf("#") + 1),
      ]),
    ]),
) as Record<DictionaryLetter, Array<[label: string, anchor: string]>>;

const dictionaryPages: Record<
  DictionaryLetter,
  LazyExoticComponent<ComponentType>
> = {
  A: lazy(() => import("../../../dictionary/a.mdx")),
  B: lazy(() => import("../../../dictionary/b.mdx")),
  C: lazy(() => import("../../../dictionary/c.mdx")),
  D: lazy(() => import("../../../dictionary/d.mdx")),
  E: lazy(() => import("../../../dictionary/e.mdx")),
  F: lazy(() => import("../../../dictionary/f.mdx")),
  G: lazy(() => import("../../../dictionary/g.mdx")),
  H: lazy(() => import("../../../dictionary/h.mdx")),
  I: lazy(() => import("../../../dictionary/i.mdx")),
  K: lazy(() => import("../../../dictionary/k.mdx")),
  L: lazy(() => import("../../../dictionary/l.mdx")),
  M: lazy(() => import("../../../dictionary/m.mdx")),
  N: lazy(() => import("../../../dictionary/n.mdx")),
  O: lazy(() => import("../../../dictionary/o.mdx")),
  P: lazy(() => import("../../../dictionary/p.mdx")),
  R: lazy(() => import("../../../dictionary/r.mdx")),
  S: lazy(() => import("../../../dictionary/s.mdx")),
  T: lazy(() => import("../../../dictionary/t.mdx")),
  U: lazy(() => import("../../../dictionary/u.mdx")),
};

const dictionaryTerms: DictionaryTerm[] = Object.entries(
  dictionaryTermsByLetter,
).flatMap(([letter, terms]) =>
  terms.map(([label, anchor]) => ({
    anchor,
    label,
    letter: letter as DictionaryLetter,
  })),
);

const termsByAnchor = new Map(
  dictionaryTerms.map((term) => [
    `${term.letter.toLowerCase()}/${term.anchor}`,
    term,
  ]),
);

function getDictionaryTerm(href: string): DictionaryTerm | null {
  const url = new URL(href, window.location.href);
  const match = url.pathname.match(/\/dictionary\/([a-z])\/?$/i);

  if (url.origin !== window.location.origin || !match || !url.hash) {
    return null;
  }

  return (
    termsByAnchor.get(
      `${match[1].toLowerCase()}/${decodeURIComponent(url.hash.slice(1))}`,
    ) ?? null
  );
}

function DictionaryDefinition({ selection }: { selection: DictionaryTerm }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const DictionaryPage = dictionaryPages[selection.letter];

  useLayoutEffect(() => {
    const content = contentRef.current;

    if (!content) {
      return;
    }

    function showSelectedDefinition() {
      const currentContent = contentRef.current;

      if (!currentContent) {
        return;
      }

      const children = Array.from(currentContent.children);
      const hasDefinitionHeading = children.some(
        (child) =>
          child instanceof HTMLHeadingElement && child.tagName === "H2",
      );
      let showSection = false;

      children.forEach((child) => {
        if (!hasDefinitionHeading) {
          (child as HTMLElement).hidden = false;
          return;
        }

        if (child instanceof HTMLHeadingElement && child.tagName === "H2") {
          showSection = child.id === selection.anchor;
        }

        (child as HTMLElement).hidden = !showSection;
      });
    }

    const observer = new MutationObserver(showSelectedDefinition);
    observer.observe(content, { childList: true });
    showSelectedDefinition();

    return () => observer.disconnect();
  }, [selection.anchor, selection.letter]);

  return (
    <div className={styles.definition} ref={contentRef}>
      <Suspense
        fallback={<p className={styles.loading}>Loading definition…</p>}
      >
        <DictionaryPage />
      </Suspense>
    </div>
  );
}

export default function DictionaryViewer(): React.JSX.Element | null {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [selection, setSelection] = useState<DictionarySelection>(null);
  const [activeLetter, setActiveLetter] = useState<DictionaryLetter>("A");
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const visibleTerms = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    if (normalizedQuery) {
      return dictionaryTerms.filter((term) =>
        term.label.toLocaleLowerCase().includes(normalizedQuery),
      );
    }

    return dictionaryTerms.filter((term) => term.letter === activeLetter);
  }, [activeLetter, query]);

  useEffect(() => {
    function openFromNavbar() {
      setSelection(null);
      setActiveLetter("A");
      setQuery("");
      setIsOpen(true);
    }

    window.addEventListener(DICTIONARY_VIEWER_OPEN_EVENT, openFromNavbar);
    return () =>
      window.removeEventListener(DICTIONARY_VIEWER_OPEN_EVENT, openFromNavbar);
  }, []);

  useEffect(() => {
    function openFromDictionaryLink(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        window.location.pathname.startsWith("/dictionary")
      ) {
        return;
      }

      const target = event.target;
      const link = target instanceof Element ? target.closest("a") : null;

      if (!link || link.dataset.dictionaryNavigation === "page") {
        return;
      }

      const term = getDictionaryTerm(link.href);

      if (!term) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setSelection(term);
      setActiveLetter(term.letter);
      setQuery("");
      setIsOpen(true);
    }

    // Capture the click before Docusaurus's Link handler can start navigation.
    document.addEventListener("click", openFromDictionaryLink, true);
    return () =>
      document.removeEventListener("click", openFromDictionaryLink, true);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      dialog.showModal();
      window.requestAnimationFrame(() => searchRef.current?.focus());
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  function closeViewer() {
    setIsOpen(false);
  }

  function handleBackdropClick(event: ReactMouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) {
      closeViewer();
    }
  }

  function selectLetter(letter: string) {
    if (!(letter in dictionaryTermsByLetter)) {
      return;
    }

    setActiveLetter(letter as DictionaryLetter);
    setSelection(null);
    setQuery("");
  }

  function selectTerm(term: DictionaryTerm) {
    setActiveLetter(term.letter);
    setSelection(term);
  }

  return (
    <dialog
      aria-labelledby="dictionary-viewer-title"
      className={styles.dialog}
      id="dictionary-viewer-dialog"
      onCancel={closeViewer}
      onClick={handleBackdropClick}
      onClose={() => setIsOpen(false)}
      ref={dialogRef}
    >
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.heading}>
            <span className={styles.headingIcon} aria-hidden="true">
              <BookOpen size={22} strokeWidth={1.8} />
            </span>
            <div>
              <p className={styles.eyebrow}>User guide tool</p>
              <h2 id="dictionary-viewer-title" className={styles.title}>
                Dictionary
              </h2>
            </div>
          </div>
          <button
            aria-label="Close dictionary"
            className={styles.closeButton}
            onClick={closeViewer}
            type="button"
          >
            <X size={21} aria-hidden="true" />
          </button>
        </header>

        <div
          aria-label="Browse dictionary by letter"
          className={styles.alphabet}
        >
          {alphabet.map((letter) => {
            const available = letter in dictionaryTermsByLetter;
            const active = available && letter === activeLetter && !query;

            return (
              <button
                aria-current={active ? "true" : undefined}
                aria-label={
                  available
                    ? `Show terms beginning with ${letter}`
                    : `No terms beginning with ${letter}`
                }
                className={styles.letterButton}
                disabled={!available}
                key={letter}
                onClick={() => selectLetter(letter)}
                type="button"
              >
                {letter}
              </button>
            );
          })}
        </div>

        <div className={styles.searchRow}>
          <label className={styles.searchLabel} htmlFor="dictionary-search">
            Search dictionary terms
          </label>
          <div className={styles.searchField}>
            <Search aria-hidden="true" size={19} strokeWidth={1.8} />
            <input
              autoComplete="off"
              id="dictionary-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search for a term…"
              ref={searchRef}
              type="search"
              value={query}
            />
          </div>
        </div>

        <div className={styles.body}>
          <aside aria-label="Dictionary terms" className={styles.termPanel}>
            <p className={styles.resultSummary} aria-live="polite">
              {query.trim()
                ? `${visibleTerms.length} search ${
                    visibleTerms.length === 1 ? "result" : "results"
                  }`
                : `${activeLetter} terms`}
            </p>
            <div className={styles.termList}>
              {visibleTerms.map((term) => (
                <button
                  aria-pressed={selection?.anchor === term.anchor}
                  className={styles.termButton}
                  key={`${term.letter}-${term.anchor}`}
                  onClick={() => selectTerm(term)}
                  type="button"
                >
                  <span>{term.label}</span>
                  <span className={styles.termLetter}>{term.letter}</span>
                </button>
              ))}
              {visibleTerms.length === 0 && (
                <div className={styles.emptyState}>
                  <strong>No matching term</strong>
                  <span>Try a shorter phrase or browse by first letter.</span>
                </div>
              )}
            </div>
          </aside>

          <main className={styles.content}>
            {selection ? (
              <>
                <DictionaryDefinition selection={selection} />
                <a
                  className={styles.fullPageLink}
                  data-dictionary-navigation="page"
                  href={`/dictionary/${selection.letter.toLowerCase()}#${
                    selection.anchor
                  }`}
                >
                  Open the full dictionary page
                  <ExternalLink aria-hidden="true" size={16} />
                </a>
              </>
            ) : (
              <div className={styles.placeholder}>
                <BookOpen aria-hidden="true" size={30} strokeWidth={1.5} />
                <h3>Choose a term</h3>
                <p>
                  Select a term from the list or search the complete
                  CloudIgniter dictionary.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </dialog>
  );
}
