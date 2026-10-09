import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import { dictionaryTermsByLetter } from "../../../dictionary-terms";
import developerDictionaries from "@docs-developer-dictionaries";
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
  ...developerDictionaries,
];
