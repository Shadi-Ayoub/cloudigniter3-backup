import { lazy } from "react";
import { developerDictionaryTermsByLetter } from "../../../developer-dictionary-terms";
import { getDictionaryTerms } from "../../../dictionary-catalog";
import type { Dictionary } from "./dictionaries";

const developerDictionaries: Dictionary[] = [
  {
    id: "developer",
    title: "Developer Dictionary",
    audience: "Company developers · Internal terminology",
    basePath: "/developer-dictionary",
    terms: getDictionaryTerms(
      developerDictionaryTermsByLetter,
      "/developer-dictionary",
    ),
    pages: {
      A: lazy(() => import("../../../developer-dictionary/a.mdx")),
      B: lazy(() => import("../../../developer-dictionary/b.mdx")),
      C: lazy(() => import("../../../developer-dictionary/c.mdx")),
      D: lazy(() => import("../../../developer-dictionary/d.mdx")),
      E: lazy(() => import("../../../developer-dictionary/e.mdx")),
      M: lazy(() => import("../../../developer-dictionary/m.mdx")),
      P: lazy(() => import("../../../developer-dictionary/p.mdx")),
      R: lazy(() => import("../../../developer-dictionary/r.mdx")),
      S: lazy(() => import("../../../developer-dictionary/s.mdx")),
      T: lazy(() => import("../../../developer-dictionary/t.mdx")),
      W: lazy(() => import("../../../developer-dictionary/w.mdx")),
    },
  },
];

export default developerDictionaries;
