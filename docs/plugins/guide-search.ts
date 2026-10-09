import { readFile } from "node:fs/promises";
import path from "node:path";
import type { LoadContext, Plugin } from "@docusaurus/types";
import type { LoadedContent } from "@docusaurus/plugin-content-docs";
import { docsEdition } from "../scripts/docs-edition";
import { searchableText, type SearchDocument } from "../src/utils/guide-search";

/** Use Docusaurus permalinks so slugs and a future host baseUrl stay correct. */
export default function guideSearch(
  context: Pick<LoadContext, "siteDir" | "baseUrl">,
): Plugin {
  return {
    name: "cloudigniter-guide-search",
    async allContentLoaded({ allContent, actions }) {
      const documents: SearchDocument[] = [];
      const instances = allContent["docusaurus-plugin-content-docs"] ?? {};
      for (const [pluginId, content] of Object.entries(instances)) {
        // Dictionary has its own term search; exclude its pages from this index.
        if (pluginId === "dictionary" || pluginId === "developerDictionary") continue;
        const { loadedVersions } = content as LoadedContent;
        for (const version of loadedVersions) {
          for (const doc of version.docs) {
            if (doc.draft || doc.unlisted) continue;
            const source = doc.source.replace(/^@site\//, "");
            const raw = await readFile(
              path.resolve(context.siteDir, source),
              "utf8",
            );
            const scope: SearchDocument["scope"] =
              pluginId === "companyDevelopers"
                ? "developers"
                : pluginId === "skills"
                  ? "skills"
                  : pluginId === "commands"
                    ? doc.id.startsWith("dev/")
                      ? "dev"
                      : doc.id.startsWith("ci/")
                        ? "ci"
                        : "commands"
                    : doc.id.startsWith("api-reference/")
                      ? "api"
                      : "users";
            if (docsEdition() === "public" && ["developers", "dev", "skills"].includes(scope)) continue;
            documents.push({
              title: doc.title,
              description: doc.description,
              headings: (raw.match(/^#{1,6}\s+.+/gm) ?? [])
                .map(searchableText)
                .join(" "),
              text: searchableText(raw),
              url: doc.permalink,
              scope,
              audience: ["developers", "dev", "skills"].includes(scope)
                ? "developer"
                : "public",
            });
          }
        }
      }
      const data = await actions.createData(
        "search-index.json",
        JSON.stringify(documents),
      );
      actions.addRoute({
        path: `${context.baseUrl}search`,
        exact: true,
        component: "@site/src/components/GuideSearchPage",
        modules: { searchIndex: data },
      });
    },
  };
}
