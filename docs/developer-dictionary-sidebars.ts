import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";
import { createDictionarySidebar } from "./dictionary-catalog";
import { developerDictionaryTermsByLetter } from "./developer-dictionary-terms";

const sidebars: SidebarsConfig = {
  developerDictionarySidebar: createDictionarySidebar(
    developerDictionaryTermsByLetter,
    "/developer-dictionary"
  ),
};

export default sidebars;
