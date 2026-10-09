import path from "node:path";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import type { LoadContext, Plugin } from "@docusaurus/types";
import { docsEdition } from "../scripts/docs-edition";

type Compiler = {
  hooks: {
    compilation: {
      tap: (
        name: string,
        handler: (compilation: {
          hooks: {
            finishModules: {
              tap: (
                name: string,
                handler: (modules: Iterable<object>) => void,
              ) => void;
            };
          };
        }) => void,
      ) => void;
    };
  };
};

export default function docsEditionPlugin(
  context: Pick<LoadContext, "siteDir">,
): Plugin {
  const publicBuild = docsEdition() === "public";
  const publicDates = path.join(
    context.siteDir,
    ".generated/editions/public-page-dates.json",
  );
  if (publicBuild) {
    const registry = JSON.parse(
      readFileSync(path.join(context.siteDir, "page-dates.json"), "utf8"),
    );
    registry.pages = Object.fromEntries(
      Object.entries(registry.pages).filter(([source]) =>
        ["docs/docs/", "docs/dictionary/", "docs/commands/ci/"].some((prefix) =>
          source.startsWith(prefix),
        ),
      ),
    );
    mkdirSync(path.dirname(publicDates), { recursive: true });
    writeFileSync(publicDates, JSON.stringify(registry));
  }
  return {
    name: "cloudigniter-docs-edition",
    configureWebpack() {
      return {
        plugins: publicBuild
          ? [
              {
                apply(compiler: Compiler) {
                  compiler.hooks.compilation.tap(
                    "CloudIgniterPublicDocsBoundary",
                    (compilation) => {
                      compilation.hooks.finishModules.tap(
                        "CloudIgniterPublicDocsBoundary",
                        (modules) => {
                          for (const module of modules) {
                            if (
                              !("resource" in module) ||
                              typeof module.resource !== "string"
                            )
                              continue;
                            const resource = module.resource.replace(
                              /\\/g,
                              "/",
                            );
                            if (
                              /\/(?:company-developers|developer-dictionary|commands\/dev|\.generated\/skills|\.agents\/skills|\.codex\/skills)\//.test(
                                resource,
                              ) ||
                              /\/developer-dictionary-terms\.ts(?:\?|$)/.test(
                                resource,
                              ) ||
                              resource ===
                                path
                                  .join(context.siteDir, "page-dates.json")
                                  .replace(/\\/g, "/")
                            ) {
                              throw new Error(
                                `Company source reached the public Docs bundle: ${resource}`,
                              );
                            }
                          }
                        },
                      );
                    },
                  );
                },
              },
            ]
          : [],
        resolve: {
          alias: {
            "@docs-page-dates": publicBuild
              ? publicDates
              : path.join(context.siteDir, "page-dates.json"),
            "@docs-developer-dictionaries": path.join(
              context.siteDir,
              "src/components/DictionaryViewer",
              docsEdition() === "public"
                ? "public-dictionaries.ts"
                : "developer-dictionaries.ts",
            ),
          },
        },
      };
    },
  };
}
