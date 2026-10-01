/** Validate the contents npm consumers will actually receive. */
export function ciValidatePackage(manifest, files) {
  const entries = new Set(files);
  function target(value) {
    if (typeof value === "string") {
      if (!value.startsWith("./dist/") || value.includes("..", 2)) throw new Error(`Package target must stay in dist: ${value}`);
      if (!entries.has(value.slice(2))) throw new Error(`Missing package export: ${value}`);
    } else if (value && typeof value === "object") {
      for (const child of Object.values(value)) target(child);
    } else throw new Error("Invalid package export target.");
  }
  for (const field of ["main", "module", "types", "exports"]) {
    if (!manifest[field]) throw new Error(`Missing package ${field}`);
    target(manifest[field]);
  }
  for (const file of files) {
    if (/^(?:package\.json|readme(?:\.[^/]+)?|licen[sc]e(?:\.[^/]+)?)$/i.test(file)) continue;
    if (!file.startsWith("dist/") || /(?:^|\/)(?:\.[^/]*|__tests__|coverage)(?:\/|$)|\.test\.|\.map$|(?:^|\/)\._/.test(file)) {
      throw new Error(`Unexpected package content: ${file}`);
    }
  }
  for (const group of ["dependencies", "peerDependencies", "optionalDependencies"]) {
    for (const [name, version] of Object.entries(manifest[group] ?? {})) {
      if (/^(?:workspace:|link:|file:)/.test(version)) throw new Error(`Unresolved workspace dependency: ${name}`);
    }
  }
}
