import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import { dictionaryTermsByLetter } from "../../../dictionary-terms";
import { developerDictionaryTermsByLetter } from "../../../developer-dictionary-terms";
import {
  getDictionaryTerms,
  type DictionaryTerm,
} from "../../../dictionary-catalog";

export type Dictionary = {
  id: "user" | "developer";
  title: string;
  audience: string;
  basePath: string;
  terms: DictionaryTerm[];
  pages: Record<string, LazyExoticComponent<ComponentType>>;
};

export const dictionaries: Dictionary[] = [
  {
    id: "user",
    title: "Dictionary",
    audience: "User guide tool",
    basePath: "/dictionary",
    terms: getDictionaryTerms(dictionaryTermsByLetter, "/dictionary"),
    pages: {
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
    },
  },
  {
    id: "developer",
    title: "Developer Dictionary",
    audience: "Company developers · Internal terminology",
    basePath: "/developer-dictionary",
    terms: getDictionaryTerms(
      developerDictionaryTermsByLetter,
      "/developer-dictionary"
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
