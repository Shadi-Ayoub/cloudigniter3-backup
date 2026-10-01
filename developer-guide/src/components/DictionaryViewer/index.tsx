import type { MouseEvent as ReactMouseEvent } from "react";
import React, {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { BookOpen, ExternalLink, Search, X } from "lucide-react";
import useBaseUrl from "@docusaurus/useBaseUrl";
import { useLocation } from "@docusaurus/router";
import { dictionaries, type Dictionary } from "./dictionaries";
import type { DictionaryTerm } from "../../../dictionary-catalog";
import { findDictionaryTerm } from "./links";
import { DICTIONARY_VIEWER_OPEN_EVENT } from "./events";
import styles from "./styles.module.css";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function DictionaryDefinition({
  selection,
  dictionary,
}: {
  selection: DictionaryTerm;
  dictionary: Dictionary;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const DictionaryPage = dictionary.pages[selection.letter];

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
        (child) => child instanceof HTMLHeadingElement && child.tagName === "H2"
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
  const baseUrl = useBaseUrl("/");
  const location = useLocation();
  const [dictionary, setDictionary] = useState(dictionaries[0]);
  const dictionaryTerms = dictionary.terms;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [selection, setSelection] = useState<DictionaryTerm | null>(null);
  const [activeLetter, setActiveLetter] = useState("A");
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const visibleTerms = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    if (normalizedQuery) {
      return dictionaryTerms.filter((term) =>
        [term.label, ...term.aliases].some((name) =>
          name.toLocaleLowerCase().includes(normalizedQuery)
        )
      );
    }

    return dictionaryTerms.filter((term) => term.letter === activeLetter);
  }, [activeLetter, query, dictionaryTerms]);

  useEffect(() => {
    function openFromNavbar(event: Event) {
      const id = event instanceof CustomEvent ? event.detail : "user";
      const nextDictionary = dictionaries.find((item) => item.id === id);
      if (!nextDictionary) return;
      setDictionary(nextDictionary);
      setSelection(null);
      setActiveLetter(nextDictionary.terms[0].letter);
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
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      const link = target instanceof Element ? target.closest("a") : null;

      if (!link || link.dataset.dictionaryNavigation === "page") {
        return;
      }

      const match = findDictionaryTerm(
        link.href,
        window.location.href,
        baseUrl,
        dictionaries
      );
      if (!match) return;
      const { dictionary: targetDictionary, term } = match;
      // Full dictionary pages keep ordinary in-page navigation.
      const path = `${baseUrl}${targetDictionary.basePath.slice(1)}`;
      if (
        !link.closest("dialog") &&
        (window.location.pathname === path ||
          window.location.pathname.startsWith(`${path}/`))
      )
        return;

      event.preventDefault();
      event.stopPropagation();
      setDictionary(targetDictionary);
      setSelection(term);
      setActiveLetter(term.letter);
      setQuery("");
      setIsOpen(true);
    }

    // Capture the click before Docusaurus's Link handler can start navigation.
    document.addEventListener("click", openFromDictionaryLink, true);
    return () =>
      document.removeEventListener("click", openFromDictionaryLink, true);
  }, [baseUrl]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, location.hash]);

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
    if (!dictionaryTerms.some((term) => term.letter === letter)) {
      return;
    }

    setActiveLetter(letter);
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
      data-dictionary-audience={dictionary.id}
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
              <p className={styles.eyebrow}>{dictionary.audience}</p>
              <h2 id="dictionary-viewer-title" className={styles.title}>
                {dictionary.title}
              </h2>
            </div>
          </div>
          <button
            aria-label={`Close ${dictionary.title.toLowerCase()}`}
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
            const available = dictionaryTerms.some(
              (term) => term.letter === letter
            );
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
                <DictionaryDefinition
                  key={`${dictionary.id}/${selection.letter}/${selection.anchor}`}
                  selection={selection}
                  dictionary={dictionary}
                />
                <a
                  className={styles.fullPageLink}
                  data-dictionary-navigation="page"
                  href={`${baseUrl}${selection.href.slice(1)}`}
                  onClick={closeViewer}
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
                  Select a term from the list or search the complete{" "}
                  {dictionary.title.toLowerCase()}.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </dialog>
  );
}
