import fs from "node:fs";
import path from "node:path";
import type { PluginOptions } from "@docusaurus/plugin-content-docs";

/** Preserve the normal sidebar generator and attach each index's source key. */
const sidebarPageDates: PluginOptions["sidebarItemsGenerator"] = (args) => {
  const repositoryRoot = path.resolve(__dirname, "../..");
  const categoriesMetadata = Object.fromEntries(
    Object.entries(args.categoriesMetadata).map(([folder, metadata]) => {
      if (metadata.link?.type !== "generated-index") return [folder, metadata];
      const directory = path.join(args.version.contentPath, folder);
      const filename = ["_category_.json", "_category_.yml", "_category_.yaml"]
        .map((name) => path.join(directory, name))
        .find((candidate) => fs.existsSync(candidate));
      if (!filename)
        throw new Error(`Missing category metadata in ${directory}.`);
      return [
        folder,
        {
          ...metadata,
          customProps: {
            ...metadata.customProps,
            pageDatesSource: path
              .relative(repositoryRoot, filename)
              .split(path.sep)
              .join("/"),
          },
        },
      ];
    }),
  );
  return args.defaultSidebarItemsGenerator({ ...args, categoriesMetadata });
};

export default sidebarPageDates;
