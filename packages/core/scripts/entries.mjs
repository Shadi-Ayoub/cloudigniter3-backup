import fs from "node:fs";
import path from "node:path";

// For the d.ts step
export const OUT_DIR = "dist";
export const TMP_TYPES_DIR = "dist/.types-tmp";

/**
 * @typedef {"client" | "other"} EntryKind
 */

/**
 * Any area you want tree-shakable & flat. Add more barrels here.
 *
 * - kind: whether this barrel should be built with the client tsup config or the non-client config
 * - barrel: path to the barrel file that re-exports modules
 * - outPrefix: subpath under dist where flat files should be written
 * - srcRoot: root of the source subtree, used to compute names and guard scope
 */
export const BARRELS = [
  {
    kind: "client",
    barrel: "src/client/index.ts",
    outPrefix: "client",
    srcRoot: "src/client",
  },
  {
    kind: "other",
    barrel: "src/server/index.ts",
    outPrefix: "server",
    srcRoot: "src/server",
  },
  {
    kind: "other",
    barrel: "src/lib/index.ts",
    outPrefix: "lib",
    srcRoot: "src/lib",
  },
];

/**
 * Keep your normal single-entry files.
 *
 * - kind: "client" entries receive the "use client" banner in tsup.
 * - kind: "other" entries are server/lib/shared entries.
 */
export const STATIC_ENTRY_PATHS = [
  {
    kind: "other",
    path: "src/server/index.ts",
  },
  {
    kind: "client",
    path: "src/client/index.ts",
  },
  {
    kind: "other",
    path: "src/lib/index.ts",
  },
];

// ---------- helpers ----------
function toEntryKeyFromSrc(p) {
  return p
    .replace(/^src\//, "")
    .replace(/\.(tsx?|jsx?)$/, "")
    .replace(/\\/g, "/");
}

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

function parseBarrel(barrelPath) {
  const text = fs.readFileSync(barrelPath, "utf8");
  const re =
    /export\s+(?:type\s+)?(?:\*\s+from|{[^}]+}\s+from)\s+['"](.+?)['"]/g;

  const rels = new Set();
  let m;

  while ((m = re.exec(text))) {
    if (m[1].startsWith(".")) rels.add(m[1]);
  }

  return [...rels];
}

function deriveFlatName(absFile, srcRootAbs) {
  const rel = path.relative(srcRootAbs, absFile);
  const parsed = path.parse(rel);

  if (parsed.name.toLowerCase() === "index") {
    const parent = path.basename(parsed.dir);
    return parent || "index";
  }

  return parsed.name;
}

function addEntry(target, outKey, srcFile) {
  if (target[outKey] && target[outKey] !== srcFile) {
    throw new Error(
      `Name collision for "${outKey}"\n - ${target[outKey]}\n - ${srcFile}`,
    );
  }

  target[outKey] = srcFile;
}

// ---------- main export ----------
export function getAllEntries() {
  const staticClientEntries = {};
  const staticOtherEntries = {};

  for (const entry of STATIC_ENTRY_PATHS) {
    const outKey = toEntryKeyFromSrc(entry.path);

    if (entry.kind === "client") {
      addEntry(staticClientEntries, outKey, entry.path);
    } else {
      addEntry(staticOtherEntries, outKey, entry.path);
    }
  }

  const barrelClientEntries = {};
  const barrelOtherEntries = {};

  for (const { kind, barrel, outPrefix, srcRoot } of BARRELS) {
    const baseDir = path.dirname(barrel);
    const srcRootAbs = path.resolve(srcRoot ?? baseDir);
    const target = kind === "client" ? barrelClientEntries : barrelOtherEntries;

    for (const rel of parseBarrel(barrel)) {
      const absBase = path.resolve(baseDir, rel);
      const absFile = resolveModule(absBase);

      if (!absFile) continue;
      if (!path.resolve(absFile).startsWith(srcRootAbs)) continue;

      const flat = deriveFlatName(absFile, srcRootAbs);
      const outKey = `${outPrefix}/${flat}`;

      addEntry(target, outKey, absFile);
    }
  }

  const clientEntries = {
    ...staticClientEntries,
    ...barrelClientEntries,
  };

  const otherEntries = {
    ...staticOtherEntries,
    ...barrelOtherEntries,
  };

  const allEntries = {
    ...clientEntries,
    ...otherEntries,
  };

  return {
    staticClientEntries,
    staticOtherEntries,
    barrelClientEntries,
    barrelOtherEntries,
    clientEntries,
    otherEntries,
    allEntries,
  };
}

// For the d.ts step
export function outKeyToJs(outKey) {
  return path.join(OUT_DIR, `${outKey}.js`);
}

export function outKeyToDts(outKey) {
  return path.join(OUT_DIR, `${outKey}.d.ts`);
}

export function srcFileToTmpDts(absSrc) {
  // tsc should compile with: rootDir="src", declarationDir="dist/.types-tmp"
  const relFromSrc = path.relative(path.resolve("src"), path.resolve(absSrc));
  const parsed = path.parse(relFromSrc);

  const file =
    parsed.name.toLowerCase() === "index"
      ? path.join(parsed.dir, "index.d.ts")
      : path.join(parsed.dir, `${parsed.name}.d.ts`);

  return path.join(TMP_TYPES_DIR, file);
}
