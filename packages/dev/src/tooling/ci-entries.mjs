import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const OUT_DIR = "dist";
export const TMP_TYPES_DIR = "dist/.types-tmp";

export const ENTRY_KIND = {
  CLIENT: "client",
  RSC: "rsc",
  OTHER: "other",
};

async function ciLoadEntriesConfig() {
  const configPath = path.join(
    process.cwd(),
    "scripts",
    process.env.CI_ENTRIES_CONFIG ?? "entries.config.mjs",
  );

  if (!fs.existsSync(configPath)) {
    throw new Error(
      [
        "Unable to locate package entries configuration.",
        "",
        `Expected: ${configPath}`,
        `Package:  ${process.cwd()}`,
      ].join("\n"),
    );
  }

  const configUrl = pathToFileURL(configPath);

  configUrl.searchParams.set("ci-cache-bust", String(Date.now()));

  const configModule = await import(configUrl.href);

  return configModule.default ?? configModule.ciEntriesConfig;
}

function toEntryKeyFromSrc(p) {
  return p
    .replace(/^src\//, "")
    .replace(/\.(tsx?|jsx?)$/, "")
    .replace(/\\/g, "/");
}

function isSourceFile(filePath) {
  return /\.(tsx?|jsx?)$/.test(filePath);
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
  const re = /export\s+(type\s+)?(?:\*\s+from|{[^}]+}\s+from)\s+['"](.+?)['"]/g;

  const rels = new Set();
  let m;

  while ((m = re.exec(text))) {
    if (m[1]) continue;
    if (m[2].startsWith(".")) rels.add(m[2]);
  }

  return [...rels];
}

function isIndexFile(filePath) {
  return path.parse(filePath).name.toLowerCase() === "index";
}

function removeSourceExtension(filePath) {
  return filePath.replace(/\.(tsx?|jsx?)$/, "");
}

function deriveFlatName(absFile, srcRootAbs) {
  const rel = path.relative(srcRootAbs, absFile);
  const parsed = path.parse(rel);

  if (parsed.name.toLowerCase() === "index") {
    return path.basename(parsed.dir) || "index";
  }

  return parsed.name;
}

function deriveStructuredKey(absFile, srcRootAbs, outPrefix) {
  const rel = path.relative(srcRootAbs, absFile).replace(/\\/g, "/");
  return `${outPrefix}/${removeSourceExtension(rel)}`;
}

function deriveBarrelOutKey({
  absFile,
  srcRootAbs,
  outPrefix,
  preserveStructure,
}) {
  if (preserveStructure) {
    return deriveStructuredKey(absFile, srcRootAbs, outPrefix);
  }

  return `${outPrefix}/${deriveFlatName(absFile, srcRootAbs)}`;
}

function collectSourceFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];

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

function getTargetByKind(kind, maps) {
  if (kind === ENTRY_KIND.CLIENT) return maps.clientEntries;
  if (kind === ENTRY_KIND.RSC) return maps.rscEntries;
  return maps.otherEntries;
}

function expandBarrelRecursively({
  barrelPath,
  srcRootAbs,
  visited = new Set(),
}) {
  const resolvedBarrelPath = path.resolve(barrelPath);

  if (visited.has(resolvedBarrelPath)) return [];

  visited.add(resolvedBarrelPath);

  const files = [];

  for (const rel of parseBarrel(resolvedBarrelPath)) {
    const absFile = resolveModule(
      path.resolve(path.dirname(resolvedBarrelPath), rel),
    );

    if (!absFile) continue;

    const resolvedAbsFile = path.resolve(absFile);

    if (!resolvedAbsFile.startsWith(srcRootAbs)) continue;

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

export async function getAllEntries() {
  const ciEntriesConfig = await ciLoadEntriesConfig();

  const maps = {
    clientEntries: {},
    rscEntries: {},
    otherEntries: {},
  };

  for (const entry of ciEntriesConfig.staticEntryPaths ?? []) {
    addEntry(
      getTargetByKind(entry.kind, maps),
      toEntryKeyFromSrc(entry.path),
      entry.path,
    );
  }

  for (const barrelConfig of ciEntriesConfig.barrels ?? []) {
    const srcRootAbs = path.resolve(barrelConfig.srcRoot);
    const target = getTargetByKind(barrelConfig.kind, maps);

    const files = expandBarrelRecursively({
      barrelPath: barrelConfig.barrel,
      srcRootAbs,
    });

    for (const absFile of files) {
      addEntry(
        target,
        deriveBarrelOutKey({
          absFile,
          srcRootAbs,
          outPrefix: barrelConfig.outPrefix,
          preserveStructure: barrelConfig.preserveStructure ?? false,
        }),
        absFile,
      );
    }
  }

  for (const rootConfig of ciEntriesConfig.structuredSourceRoots ?? []) {
    const srcRootAbs = path.resolve(rootConfig.srcRoot);
    const target = getTargetByKind(rootConfig.kind, maps);

    for (const absFile of collectSourceFiles(srcRootAbs)) {
      addEntry(
        target,
        deriveStructuredKey(absFile, srcRootAbs, rootConfig.outPrefix),
        absFile,
      );
    }
  }

  return {
    ...maps,
    allEntries: {
      ...maps.clientEntries,
      ...maps.rscEntries,
      ...maps.otherEntries,
    },
  };
}

export function outKeyToJs(outKey) {
  return path.join(OUT_DIR, `${outKey}.js`);
}

export function outKeyToDts(outKey) {
  return path.join(OUT_DIR, `${outKey}.d.ts`);
}

export function srcFileToTmpDts(absSrc) {
  const relFromSrc = path.relative(path.resolve("src"), path.resolve(absSrc));
  const parsed = path.parse(relFromSrc);

  return path.join(
    TMP_TYPES_DIR,
    parsed.name.toLowerCase() === "index"
      ? path.join(parsed.dir, "index.d.ts")
      : path.join(parsed.dir, `${parsed.name}.d.ts`),
  );
}
