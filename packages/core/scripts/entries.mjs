import fs from "node:fs";
import path from "node:path";

// For the d.ts step
export const OUT_DIR = "dist";
export const TMP_TYPES_DIR = "dist/.types-tmp";

/**
 * Any area you want tree-shakable & flat. Add more barrels here.
 * - barrel: path to the barrel file that re-exports modules
 * - outDir: subpath under dist where flat files should be written
 * - srcRoot: root of the source subtree (used to compute names & guard scope)
 */
export const BARRELS = [
  // {
  //   barrel: "src/ui/components/index.ts",
  //   outPrefix: "ui/components",
  //   srcRoot: "src/ui/components",
  // },
  // add more:
  // { barrel: "src/ui/layout/index.ts", outPrefix: "ui/layout", srcRoot: "src/ui/layout" },
];

/**
 * Keep your normal single-entry files (no globs here)
 * No globs here. Let the barrels above control what gets emitted.
 */
export const STATIC_ENTRY_PATHS = [
  // "src/index.ts",
  "src/server/index.ts",
  "src/client/index.ts",
  "src/lib/index.ts",
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
  for (const t of tries) if (fs.existsSync(t)) return t;
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

// ---------- main export ----------
export function getAllEntries() {
  // static (kept as-is)
  const staticEntries = Object.fromEntries(
    STATIC_ENTRY_PATHS.map((p) => [toEntryKeyFromSrc(p), p]),
  );

  // barrel-driven (flattened)
  const barrelEntries = {};
  for (const { barrel, outPrefix, srcRoot } of BARRELS) {
    const baseDir = path.dirname(barrel);
    const srcRootAbs = path.resolve(srcRoot ?? baseDir);
    for (const rel of parseBarrel(barrel)) {
      const absBase = path.resolve(baseDir, rel);
      const absFile = resolveModule(absBase);
      if (!absFile) continue;
      if (!path.resolve(absFile).startsWith(srcRootAbs)) continue; // safety

      const flat = deriveFlatName(absFile, srcRootAbs);
      const outKey = `${outPrefix}/${flat}`;

      if (barrelEntries[outKey] && barrelEntries[outKey] !== absFile) {
        throw new Error(
          `Name collision for "${outKey}"\n - ${barrelEntries[outKey]}\n - ${absFile}`,
        );
      }
      barrelEntries[outKey] = absFile;
    }
  }

  const allEntries = { ...staticEntries, ...barrelEntries };
  return { staticEntries, barrelEntries, allEntries };
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
