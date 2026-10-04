import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";
import { createDictionarySidebar } from "./dictionary-catalog";
import { dictionaryTermsByLetter } from "./dictionary-terms";

const dictionarySidebar = createDictionarySidebar(
  dictionaryTermsByLetter,
  "/dictionary"
);

const sidebars: SidebarsConfig = { dictionarySidebar };

export default sidebars;
