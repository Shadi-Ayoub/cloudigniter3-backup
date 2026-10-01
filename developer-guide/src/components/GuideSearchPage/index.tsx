import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import { useHistory, useLocation } from "@docusaurus/router";
import {
  searchDocuments,
  searchExcerpt,
  searchScopes,
  type SearchDocument,
  type SearchScope,
} from "../../utils/guide-search";
import Highlight from "../SearchHighlight";
import styles from "./styles.module.css";

export default function GuideSearchPage({
  searchIndex,
}: {
  searchIndex: SearchDocument[];
}): React.JSX.Element {
  const location = useLocation();
  const history = useHistory();
  const params = new URLSearchParams(location.search);
  const urlQuery = params.get("q") ?? "";
  const selectedScope = params.get("scope") ?? "all";
  const scope: SearchScope = Object.prototype.hasOwnProperty.call(
    searchScopes,
    selectedScope,
  )
    ? (selectedScope as SearchScope)
    : "all";
  const [query, setQuery] = useState(urlQuery);
  const [limit, setLimit] = useState(20);
  const deferredQuery = useDeferredValue(query);
  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);
  useEffect(() => {
    setLimit(20);
  }, [deferredQuery, scope]);
  const results = useMemo(
    () => searchDocuments(searchIndex, deferredQuery, scope),
    [searchIndex, deferredQuery, scope],
  );
  function updateUrl(value: string, nextScope: SearchScope) {
    history.replace({
      pathname: location.pathname,
      search: `?${new URLSearchParams({ q: value, scope: nextScope })}`,
    });
  }
  return (
    <Layout
      title="Search guides"
      description="Search CloudIgniter guides, commands, and API Reference."
    >
      <main className={styles.main}>
        <h1>Search the guides</h1>
        <p>
          Find commands, APIs, concepts, and examples across the documentation.
        </p>
        <form
          role="search"
          aria-label="Guide search results"
          onSubmit={(event) => {
            event.preventDefault();
            updateUrl(query, scope);
          }}
        >
          <label htmlFor="guide-query">Search documentation</label>
          <div className={styles.queryRow}>
            <input
              id="guide-query"
              name="q"
              type="search"
              placeholder="Try ci modules validate or tenant routing"
              value={query}
              maxLength={200}
              onChange={(event) => {
                setQuery(event.target.value);
                updateUrl(event.target.value, scope);
              }}
            />
            <button type="submit">Search</button>
          </div>
          <label htmlFor="guide-scope">Search in</label>
          <select
            id="guide-scope"
            value={scope}
            onChange={(event) =>
              updateUrl(query, event.target.value as SearchScope)
            }
          >
            {Object.entries(searchScopes).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </form>
        {!query.trim() ? (
          <div className={styles.empty}>
            <h2>What are you looking for?</h2>
            <p>
              Enter a command, API name, error message, or a few keywords. You
              can narrow results to one guide.
            </p>
          </div>
        ) : (
          <>
            <p className={styles.status} role="status" aria-live="polite">
              {results.length} {results.length === 1 ? "result" : "results"} for
              “{deferredQuery}”
              {scope !== "all" ? ` in ${searchScopes[scope]}` : ""}
            </p>
            {results.length === 0 ? (
              <div className={styles.empty}>
                <h2>No matching documents</h2>
                <p>
                  Check the spelling, try fewer words, or search in all guides.
                </p>
                {scope !== "all" && (
                  <button type="button" onClick={() => updateUrl(query, "all")}>
                    Search all guides
                  </button>
                )}
              </div>
            ) : (
              <ol className={styles.results}>
                {results.slice(0, limit).map((doc) => (
                  <li key={doc.url}>
                    <p className={styles.scope}>{searchScopes[doc.scope]}</p>
                    <h2>
                      <Link to={doc.url}>
                        <Highlight text={doc.title} query={deferredQuery} />
                      </Link>
                    </h2>
                    <p>
                      <Highlight
                        text={searchExcerpt(doc, deferredQuery)}
                        query={deferredQuery}
                      />
                    </p>
                  </li>
                ))}
              </ol>
            )}
            {results.length > limit && (
              <button type="button" onClick={() => setLimit(limit + 20)}>
                Show more results ({results.length - limit} remaining)
              </button>
            )}
          </>
        )}
      </main>
    </Layout>
  );
}
