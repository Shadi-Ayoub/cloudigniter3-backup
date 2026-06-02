import fs from "node:fs";
import path from "node:path";

/**
 * Distribution output directory.
 */
export const OUT_DIR = "dist";

/**
 * Temporary declaration output directory used before Rollup bundles `.d.ts` files.
 */
export const TMP_TYPES_DIR = "dist/.types-tmp";

/**
 * Build entry categories.
 *
 * - CLIENT: Browser/client modules. Output files must start with `"use client"`.
 * - RSC: React Server Component modules. They may render Client Components, so imports must be preserved.
 * - OTHER: Server, proxy, and utility modules. These may be bundled.
 */
export const ENTRY_KIND = {
  CLIENT: "client",
  RSC: "rsc",
  OTHER: "other",
};

/**
 * Barrel-driven entries.
 *
 * `preserveStructure: true` keeps nested folder paths in the generated output.
 * This is important for client and RSC modules because preserved re-exports
 * require relative paths to continue resolving correctly.
 *
 * Type-only exports are ignored when generating JS entries.
 */
export const BARRELS = [
  {
    kind: ENTRY_KIND.CLIENT,
    barrel: "src/client/index.ts",
    outPrefix: "client",
    srcRoot: "src/client",
    preserveStructure: true,
  },
  {
    kind: ENTRY_KIND.OTHER,
    barrel: "src/server/index.ts",
    outPrefix: "server",
    srcRoot: "src/server",
    preserveStructure: false,
  },
  {
    kind: ENTRY_KIND.OTHER,
    barrel: "src/lib/index.ts",
    outPrefix: "lib",
    srcRoot: "src/lib",
    preserveStructure: true,
  },
];

/**
 * Complete source subtrees that must be emitted with their relative folder
 * structure preserved.
 *
 * These are used mainly for RSC entries because RSC output uses `bundle: false`.
 * With `bundle: false`, normal local imports such as `./CiDashboardCard` remain
 * in the emitted JS, so the imported sibling files must also exist in `dist`.
 */
export const STRUCTURED_SOURCE_ROOTS = [];

/**
 * Explicit public entrypoints.
 */
export const STATIC_ENTRY_PATHS = [
  { kind: ENTRY_KIND.CLIENT, path: "src/client/index.ts" },
  { kind: ENTRY_KIND.OTHER, path: "src/server/index.ts" },
  { kind: ENTRY_KIND.OTHER, path: "src/lib/index.ts" },
];

/**
 * Converts a source path into a tsup entry key.
 *
 * Example:
 * `src/layout/app-standard/index.ts` -> `layout/app-standard/index`
 *
 * @param {string} p Source file path.
 * @returns {string} Entry key used by tsup.
 */
function toEntryKeyFromSrc(p) {
  return p
    .replace(/^src\//, "")
    .replace(/\.(tsx?|jsx?)$/, "")
    .replace(/\\/g, "/");
}

/**
 * Checks whether a file is a supported JS/TS source file.
 *
 * @param {string} filePath File path.
 * @returns {boolean} True when file is JS/TS source.
 */
function isSourceFile(filePath) {
  return /\.(tsx?|jsx?)$/.test(filePath);
}

/**
 * Resolves a module path without extension to an existing source file.
 *
 * Supports direct files and folder index files.
 *
 * @param {string} baseNoExt Absolute or relative path without extension.
 * @returns {string | undefined} Resolved file path when found.
 */
function resolveModule(baseNoExt) {
  const tries = [
    `${baseNoExt}.tsx`,
    `${baseNoExt}.ts`,
    path.join(baseNoExt, "index.tsx"),
    path.join(baseNoExt, "index.ts"),
    `${baseNoExt}.jsx`,
    `${baseNoExt}.js`,
    path.join(baseNoExt, "index.jsx"),
    path.join(baseNoExt, "index.js"),
  ];

  for (const t of tries) {
    if (fs.existsSync(t)) return t;
  }

  return undefined;
}

/**
 * Parses relative runtime re-export module specifiers from a barrel file.
 *
 * Important:
 * - `export type ... from` is intentionally ignored because it should not
 *   generate JavaScript entries.
 *
 * Supports:
 * - export * from "./x"
 * - export { X } from "./x"
 *
 * Skips:
 * - export type * from "./x"
 * - export type { X } from "./x"
 *
 * @param {string} barrelPath Path to the barrel file.
 * @returns {string[]} Relative runtime module specifiers exported by the barrel.
 */
function parseBarrel(barrelPath) {
  const text = fs.readFileSync(barrelPath, "utf8");

  const re = /export\s+(type\s+)?(?:\*\s+from|{[^}]+}\s+from)\s+['"](.+?)['"]/g;

  const rels = new Set();
  let m;

  while ((m = re.exec(text))) {
    const isTypeOnlyExport = Boolean(m[1]);
    const moduleSpecifier = m[2];

    if (isTypeOnlyExport) continue;

    if (moduleSpecifier.startsWith(".")) {
      rels.add(moduleSpecifier);
    }
  }

  return [...rels];
}

/**
 * Checks whether a file path points to an index module.
 *
 * @param {string} filePath Source file path.
 * @returns {boolean} True when file basename is `index`.
 */
function isIndexFile(filePath) {
  return path.parse(filePath).name.toLowerCase() === "index";
}

/**
 * Removes a JS/TS source extension from a path.
 *
 * @param {string} filePath File path.
 * @returns {string} Path without source extension.
 */
function removeSourceExtension(filePath) {
  return filePath.replace(/\.(tsx?|jsx?)$/, "");
}

/**
 * Derives a flattened output name from a source file.
 *
 * For `index.ts`, the parent folder name is used.
 *
 * Example:
 * `src/lib/result/index.ts` -> `result`
 *
 * @param {string} absFile Absolute source file path.
 * @param {string} srcRootAbs Absolute source root path.
 * @returns {string} Flat output name.
 */
function deriveFlatName(absFile, srcRootAbs) {
  const rel = path.relative(srcRootAbs, absFile);
  const parsed = path.parse(rel);

  if (parsed.name.toLowerCase() === "index") {
    const parent = path.basename(parsed.dir);
    return parent || "index";
  }

  return parsed.name;
}

/**
 * Derives a structure-preserving output key.
 *
 * Example:
 * `src/ui/server/dashboard/CiDashboardPage.tsx`
 * -> `ui/server/dashboard/CiDashboardPage`
 *
 * @param {string} absFile Absolute source file path.
 * @param {string} srcRootAbs Absolute source root path.
 * @param {string} outPrefix Output prefix under `dist`.
 * @returns {string} Structure-preserving output key.
 */
function deriveStructuredKey(absFile, srcRootAbs, outPrefix) {
  const rel = path.relative(srcRootAbs, absFile).replace(/\\/g, "/");
  const noExt = removeSourceExtension(rel);

  return `${outPrefix}/${noExt}`;
}

/**
 * Derives the output key for a barrel-generated entry.
 *
 * Client entries preserve structure to avoid name collisions.
 * Controlled utility barrels may flatten for ergonomic public imports.
 *
 * @param {object} params Parameters.
 * @param {string} params.absFile Absolute source file path.
 * @param {string} params.srcRootAbs Absolute source root path.
 * @param {string} params.outPrefix Output prefix under `dist`.
 * @param {boolean} params.preserveStructure Whether to preserve folder structure.
 * @returns {string} Output key.
 */
function deriveBarrelOutKey({
  absFile,
  srcRootAbs,
  outPrefix,
  preserveStructure,
}) {
  if (preserveStructure) {
    return deriveStructuredKey(absFile, srcRootAbs, outPrefix);
  }

  const flat = deriveFlatName(absFile, srcRootAbs);
  return `${outPrefix}/${flat}`;
}

/**
 * Recursively collects all JS/TS source files under a directory.
 *
 * This is used for source roots built with `bundle: false`, where every
 * local import must have a corresponding emitted JS file.
 *
 * @param {string} dirPath Directory to scan.
 * @returns {string[]} Source files under the directory.
 */
function collectSourceFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const files = [];

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const entryPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(entryPath));
      continue;
    }

    if (entry.isFile() && isSourceFile(entry.name)) {
      files.push(path.resolve(entryPath));
    }
  }

  return files;
}

/**
 * Adds an entry to an entry map while detecting real output key collisions.
 *
 * The same source file may appear once as a relative path and once as an
 * absolute path. That should not be treated as a collision.
 *
 * @param {Record<string, string>} target Entry map to mutate.
 * @param {string} outKey Output key.
 * @param {string} srcFile Source file path.
 */
function addEntry(target, outKey, srcFile) {
  const normalizedSrcFile = path.resolve(srcFile);

  if (target[outKey]) {
    const existing = path.resolve(target[outKey]);

    if (existing !== normalizedSrcFile) {
      throw new Error(
        `Name collision for "${outKey}"\n - ${target[outKey]}\n - ${srcFile}`,
      );
    }

    return;
  }

  target[outKey] = srcFile;
}

/**
 * Selects the correct entry map for a build kind.
 *
 * @param {string} kind Entry kind.
 * @param {{ clientEntries: Record<string, string>, rscEntries: Record<string, string>, otherEntries: Record<string, string> }} maps Entry maps.
 * @returns {Record<string, string>} Selected entry map.
 */
function getTargetByKind(kind, maps) {
  if (kind === ENTRY_KIND.CLIENT) return maps.clientEntries;
  if (kind === ENTRY_KIND.RSC) return maps.rscEntries;
  return maps.otherEntries;
}

/**
 * Recursively expands a barrel file into all source files reachable through
 * runtime relative re-exports.
 *
 * Type-only exports are skipped by `parseBarrel()`.
 *
 * @param {object} params Parameters.
 * @param {string} params.barrelPath Barrel file path.
 * @param {string} params.srcRootAbs Absolute source root used as safety boundary.
 * @param {Set<string>} [params.visited] Tracks visited barrels to prevent cycles.
 * @returns {string[]} Unique resolved source files referenced by the barrel tree.
 */
function expandBarrelRecursively({
  barrelPath,
  srcRootAbs,
  visited = new Set(),
}) {
  const resolvedBarrelPath = path.resolve(barrelPath);

  if (visited.has(resolvedBarrelPath)) {
    return [];
  }

  visited.add(resolvedBarrelPath);

  const files = [];

  for (const rel of parseBarrel(resolvedBarrelPath)) {
    const baseDir = path.dirname(resolvedBarrelPath);
    const absBase = path.resolve(baseDir, rel);
    const absFile = resolveModule(absBase);

    if (!absFile) continue;

    const resolvedAbsFile = path.resolve(absFile);

    if (!resolvedAbsFile.startsWith(srcRootAbs)) {
      continue;
    }

    files.push(resolvedAbsFile);

    if (isIndexFile(resolvedAbsFile)) {
      files.push(
        ...expandBarrelRecursively({
          barrelPath: resolvedAbsFile,
          srcRootAbs,
          visited,
        }),
      );
    }
  }

  return [...new Set(files)];
}

/**
 * Generates all tsup entry maps grouped by build category.
 *
 * @returns {{
 *   clientEntries: Record<string, string>,
 *   rscEntries: Record<string, string>,
 *   otherEntries: Record<string, string>,
 *   allEntries: Record<string, string>
 * }} Entry maps.
 */
export function getAllEntries() {
  const maps = {
    clientEntries: {},
    rscEntries: {},
    otherEntries: {},
  };

  for (const entry of STATIC_ENTRY_PATHS) {
    const outKey = toEntryKeyFromSrc(entry.path);
    const target = getTargetByKind(entry.kind, maps);

    addEntry(target, outKey, entry.path);
  }

  for (const {
    kind,
    barrel,
    outPrefix,
    srcRoot,
    preserveStructure = false,
  } of BARRELS) {
    const srcRootAbs = path.resolve(srcRoot);
    const target = getTargetByKind(kind, maps);

    const files = expandBarrelRecursively({
      barrelPath: barrel,
      srcRootAbs,
    });

    for (const absFile of files) {
      const outKey = deriveBarrelOutKey({
        absFile,
        srcRootAbs,
        outPrefix,
        preserveStructure,
      });

      addEntry(target, outKey, absFile);
    }
  }

  for (const { kind, srcRoot, outPrefix } of STRUCTURED_SOURCE_ROOTS) {
    const srcRootAbs = path.resolve(srcRoot);
    const target = getTargetByKind(kind, maps);

    for (const absFile of collectSourceFiles(srcRootAbs)) {
      const outKey = deriveStructuredKey(absFile, srcRootAbs, outPrefix);

      addEntry(target, outKey, absFile);
    }
  }

  const allEntries = {
    ...maps.clientEntries,
    ...maps.rscEntries,
    ...maps.otherEntries,
  };

  return {
    ...maps,
    allEntries,
  };
}

/**
 * Converts an output key to the generated JavaScript file path.
 *
 * @param {string} outKey Output key.
 * @returns {string} JavaScript output path.
 */
export function outKeyToJs(outKey) {
  return path.join(OUT_DIR, `${outKey}.js`);
}

/**
 * Converts an output key to the generated declaration file path.
 *
 * @param {string} outKey Output key.
 * @returns {string} Declaration output path.
 */
export function outKeyToDts(outKey) {
  return path.join(OUT_DIR, `${outKey}.d.ts`);
}

/**
 * Maps a source file to its temporary declaration output path.
 *
 * This assumes `tsc` is configured with:
 * - rootDir: "src"
 * - declarationDir: "dist/.types-tmp"
 *
 * @param {string} absSrc Absolute or relative source file path.
 * @returns {string} Temporary `.d.ts` path.
 */
export function srcFileToTmpDts(absSrc) {
  const relFromSrc = path.relative(path.resolve("src"), path.resolve(absSrc));
  const parsed = path.parse(relFromSrc);

  const file =
    parsed.name.toLowerCase() === "index"
      ? path.join(parsed.dir, "index.d.ts")
      : path.join(parsed.dir, `${parsed.name}.d.ts`);

  return path.join(TMP_TYPES_DIR, file);
}
