import type { Dictionary } from "./dictionaries";

/** Match canonical, same-origin definition links, including hosted base paths. */
export function findDictionaryTerm<
  T extends Pick<Dictionary, "id" | "basePath" | "terms">
>(href: string, currentUrl: string, baseUrl: string, dictionaries: T[]) {
  try {
    const url = new URL(href, currentUrl);
    if (url.origin !== new URL(currentUrl).origin || !url.hash) return null;
    const anchor = decodeURIComponent(url.hash.slice(1));
    for (const dictionary of dictionaries) {
      const term = dictionary.terms.find(
        (candidate) =>
          candidate.anchor === anchor &&
          url.pathname.replace(/\/$/, "") ===
            `${baseUrl}${dictionary.basePath.slice(
              1
            )}/${candidate.letter.toLowerCase()}`
      );
      if (term) return { dictionary, term };
    }
  } catch {
    // Invalid URL/hash: let the browser follow the original link normally.
  }
  return null;
}
