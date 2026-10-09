import type { Dictionary } from "./dictionaries";

// The public build aliases the company dictionary module to this file, keeping
// its catalog and MDX imports out of the dependency graph and emitted chunks.
const developerDictionaries: Dictionary[] = [];
export default developerDictionaries;
