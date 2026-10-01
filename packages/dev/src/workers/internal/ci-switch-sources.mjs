#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { parse } from "jsonc-parser";

// ------------------------------------------------------------------------------------
// take “src” or “dist” as argument
// ------------------------------------------------------------------------------------
const target = process.argv[2];

if (!["src", "dist"].includes(target)) {
  console.error("Usage: switch-sources.mjs [src|dist]");
  process.exit(1);
}
// ------------------------------------------------------------------------------------

// ------------------------------------------------------------------------------------
// load config from the package where the command is run
// ------------------------------------------------------------------------------------
const packageRoot = process.cwd();

const configPath = path.resolve(
  packageRoot,
  "./scripts/ci-switch-sources.config.mjs",
);

if (!fs.existsSync(configPath)) {
  console.error(`ci-switch-sources.config.mjs not found in ${configPath}`);
  process.exit(1);
}

const { default: config } = await import(pathToFileURL(configPath).href);
// ------------------------------------------------------------------------------------

// ------------------------------------------------------------------------------------
// load package.json
// ------------------------------------------------------------------------------------
const pkgPath = path.resolve(packageRoot, "package.json");
const currentPackageTsconfigPath = path.resolve(packageRoot, "tsconfig.json");

if (!fs.existsSync(pkgPath)) {
  console.error(`package.json not found in ${packageRoot}`);
  process.exit(1);
}

const pkg = readJsonFile(pkgPath);
// ------------------------------------------------------------------------------------

// ------------------------------------------------------------------------------------
// load mapping
// ------------------------------------------------------------------------------------
const mapping = loadMapping();
// ------------------------------------------------------------------------------------

// ------------------------------------------------------------------------------------
// helper functions
// ------------------------------------------------------------------------------------

// ---------- read json file ----------
function readJsonFile(filePath) {
  const text = fs.readFileSync(filePath, "utf8");

  try {
    const result = parse(text);

    if (result === undefined) {
      throw new Error("Invalid JSONC");
    }

    return result;
  } catch (error) {
    throw new Error(`Failed to parse JSON file: ${filePath}\n${error.message}`);
  }
}

// ---------- write json file ----------
function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
}

// ---------- get special export path ----------
function getSpecialExportPath(name) {
  const entry = config.specialExports?.[name];

  if (!entry) return null;

  return target === "src" ? entry.src : entry.dist;
}

// ---------- check if the export path is a CSS path ----------
function isCssExport(value) {
  return (
    Boolean(config.css) &&
    typeof value === "string" &&
    value.includes("/styles/") &&
    value.endsWith(".css")
  );
}

// ---------- normalize an export key: strip leading "./" and trailing "/" ----------
function normalizeKey(k) {
  return k.replace(/^\.\//, "").replace(/\/$/, "");
}

// ---------- swap src↔dist, flip .js↔.ts/.tsx↔.js ----------
function replaceCodePath(value) {
  let nextValue = value.replace(/^(?:\.\/)?(src|dist)\//, `./${target}/`);

  if (target === "src") {
    return nextValue.replace(/\.d\.ts$/, ".ts").replace(/\.js$/, ".ts");
  }

  return nextValue.replace(/\.(ts|tsx)$/, ".js");
}

// ---------- map any CSS under a "styles" directory to your src/dist styles ----------
function replaceCssPath(value) {
  if (!config.css) return value;

  const srcPrefix = config.css.srcPrefix;
  const distPrefix = config.css.distPrefix;

  if (!srcPrefix || !distPrefix) return value;

  if (target === "src") {
    return value.replace(/^\.\/dist\/styles\//, srcPrefix);
  }

  return value.replace(/^\.\/src\/styles\//, distPrefix);
}

// ---------- infer "types" from existing code path if not set explicitly ----------
function inferTypesFromCodePath(codePath) {
  if (typeof codePath !== "string") return null;

  if (target === "src") {
    return codePath
      .replace(/\.d\.ts$/, ".ts")
      .replace(/\.(tsx|jsx|js)$/, ".ts");
  }

  return codePath.replace(/\.(tsx|ts|jsx|js)$/, ".d.ts");
}

// ---------- try load mapping file ----------
function loadMapping() {
  const candidates = [
    path.resolve(packageRoot, "./scripts/ci-switch-sources.mapping.json"),
    path.resolve(packageRoot, "./scripts/switch-sources.mapping.json"),
  ];

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;

    try {
      return readJsonFile(candidate);
    } catch (error) {
      console.warn(`⚠️ Failed to parse mapping file at ${candidate}`);
      console.warn(error.message);
    }
  }

  return { rules: [] };
}

// ---------- convert wildcard pattern to RegExp with captures ----------
function patternToRegex(pattern) {
  let escaped = pattern
    .replace(/[|\\{}()[\]^$+?.]/g, "\\$&")
    .replace(/\*/g, "\\*");

  escaped = escaped.replace(/\\\*\\\*/g, "(.*)").replace(/\\\*/g, "([^/]+)");

  return new RegExp(`^${escaped}$`);
}

// ---------- render template with {1}, {2}, ... from regex match groups ----------
function renderTemplate(template, match) {
  return template.replace(
    /\{(\d+)\}/g,
    (_, index) => match[Number(index)] ?? "",
  );
}

// ---------- findRuleForKey!!! ----------
function findRuleForKey(key) {
  if (!mapping?.rules?.length) return null;

  for (const rule of mapping.rules) {
    if (!rule?.key) continue;

    const regex = patternToRegex(rule.key);
    const match = key.match(regex);

    if (match) {
      return {
        spec: rule,
        match,
      };
    }
  }

  return null;
}

// ---------- apply a specific condition mapping if present ----------
function mapCondition(ruleSpec, match, condition) {
  if (ruleSpec.applyToAll && ruleSpec.map) {
    const template = target === "src" ? ruleSpec.map.src : ruleSpec.map.dist;
    return renderTemplate(template, match);
  }

  const conditionMap = ruleSpec.conditions?.[condition];

  if (conditionMap) {
    const template = target === "src" ? conditionMap.src : conditionMap.dist;
    return renderTemplate(template, match);
  }

  return null;
}

// ---------- buildExactObject!!!! ----------
function buildExactObject(ruleSpec, match, currentTarget) {
  const source = ruleSpec.conditions ?? ruleSpec.map ?? {};
  const output = {};

  for (const condition of Object.keys(source)) {
    const mapping = source[condition];

    if (mapping && typeof mapping === "object") {
      const template = currentTarget === "src" ? mapping.src : mapping.dist;

      if (typeof template === "string") {
        output[condition] = renderTemplate(template, match);
      }
    }
  }

  return output;
}

// ---------- Update the application template tsconfig.json file by adding/removing the package source alias. ----------
function updateAppTemplateTsconfigAlias() {
  if (!config.appTemplate?.tsconfigPath || !config.sourceAlias) return;

  const appTemplateTsconfigPath = path.resolve(
    packageRoot,
    config.appTemplate.tsconfigPath,
  );

  if (!fs.existsSync(appTemplateTsconfigPath)) {
    console.warn(
      `⚠️ App template tsconfig not found: ${appTemplateTsconfigPath}`,
    );
    return;
  }

  const tsconfig = readJsonFile(appTemplateTsconfigPath);

  tsconfig.compilerOptions ??= {};
  tsconfig.compilerOptions.paths ??= {};

  if (target === "src") {
    tsconfig.compilerOptions.paths[config.sourceAlias.alias] = [
      config.sourceAlias.appPath,
    ];
  } else {
    delete tsconfig.compilerOptions.paths[config.sourceAlias.alias];
  }

  writeJsonFile(appTemplateTsconfigPath, tsconfig);

  console.log(
    target === "src"
      ? `Added ${config.sourceAlias.alias} to app template tsconfig`
      : `Removed ${config.sourceAlias.alias} from app template tsconfig`,
  );
}

// ---------- Update the current package tsconfig.json by adding/removing source aliases to sibling workspace packages. ----------
function updateCurrentPackageTsconfigAliases() {
  if (!config.currentPackageAliases?.length) return;

  if (!fs.existsSync(currentPackageTsconfigPath)) {
    console.warn(
      `⚠️ Current package tsconfig not found: ${currentPackageTsconfigPath}`,
    );
    return;
  }

  const tsconfig = readJsonFile(currentPackageTsconfigPath);

  tsconfig.compilerOptions ??= {};
  tsconfig.compilerOptions.paths ??= {};

  if (target === "src") {
    for (const item of config.currentPackageAliases) {
      tsconfig.compilerOptions.paths[item.alias] = [item.path];
    }
  } else {
    for (const item of config.currentPackageAliases) {
      delete tsconfig.compilerOptions.paths[item.alias];
    }
  }

  writeJsonFile(currentPackageTsconfigPath, tsconfig);

  console.log(
    target === "src"
      ? "Added current package source aliases"
      : "Removed current package source aliases",
  );
}
// ------------------------------------------------------------------------------------

/**
 * Resolves the application template root folder.
 *
 * Priority:
 * 1. config.appTemplate.rootPath
 * 2. directory of config.appTemplate.tsconfigPath
 * 3. current package root
 *
 * @returns {string} Absolute application template root path.
 */
function ciResolveAppTemplateRootPath() {
  if (config.appTemplate?.rootPath) {
    return path.resolve(packageRoot, config.appTemplate.rootPath);
  }

  if (config.appTemplate?.tsconfigPath) {
    return path.dirname(
      path.resolve(packageRoot, config.appTemplate.tsconfigPath),
    );
  }

  return packageRoot;
}

/**
 * Resolves the application template globals.css file.
 *
 * By default, it expects:
 * src/app/globals.css
 *
 * @returns {string} Absolute globals.css path.
 */
function ciResolveAppTemplateGlobalsCssPath() {
  if (config.appTemplate?.globalsCssPath) {
    return path.resolve(packageRoot, config.appTemplate.globalsCssPath);
  }

  return path.resolve(ciResolveAppTemplateRootPath(), "src/app/globals.css");
}

/**
 * Converts a filesystem path to a CSS-friendly relative source path.
 *
 * @param {string} fromDir - Directory containing globals.css.
 * @param {string} toPath - Target source directory.
 * @returns {string} Normalized relative path.
 */
function ciBuildRelativeCssSourcePath(fromDir, toPath) {
  const relativePath = path.relative(fromDir, toPath).replaceAll(path.sep, "/");

  return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
}

/**
 * Gets the current package short name.
 *
 * Example:
 * @cloudigniter/core -> core
 *
 * @returns {string} Package short name.
 */
function ciGetPackageShortName() {
  return String(pkg.name ?? config.packageName ?? "")
    .split("/")
    .at(-1);
}

/**
 * Builds the Tailwind @source line for the current package and selected target.
 *
 * @param {string} globalsCssPath - Absolute globals.css path.
 * @returns {string} Tailwind @source statement.
 */
function ciBuildTailwindSourceLine(globalsCssPath) {
  const globalsCssDir = path.dirname(globalsCssPath);
  const appTemplateRoot = ciResolveAppTemplateRootPath();
  const packageName = config.packageName ?? pkg.name;
  const packageShortName = ciGetPackageShortName();

  if (!packageName || !packageShortName) {
    throw new Error("Cannot build Tailwind @source line without package name.");
  }

  const sourceRoot =
    target === "src"
      ? path.resolve(packageRoot, "src")
      : path.resolve(appTemplateRoot, "node_modules", packageName, "dist");

  const relativeSourceRoot = ciBuildRelativeCssSourcePath(
    globalsCssDir,
    sourceRoot,
  );

  const glob = target === "src" ? "**/*.{ts,tsx}" : "**/*.{js,mjs}";

  return `@source "${relativeSourceRoot}/${glob}";`;
}

/**
 * Checks whether a globals.css line is a Tailwind @source line for this package.
 *
 * @param {string} line - CSS line.
 * @returns {boolean} Whether the line points to this package.
 */
function ciIsTailwindSourceLineForCurrentPackage(line) {
  const packageName = config.packageName ?? pkg.name;
  const packageShortName = ciGetPackageShortName();
  const normalizedLine = line.replaceAll("\\", "/");

  return (
    normalizedLine.includes("@source") &&
    (normalizedLine.includes(`node_modules/${packageName}/dist/`) ||
      normalizedLine.includes(`packages/${packageShortName}/src/`))
  );
}

/**
 * Finds where a Tailwind @source line should be inserted.
 *
 * Insert after the last @source statement. If no @source exists,
 * insert after the last @import statement.
 *
 * @param {string[]} lines - CSS file lines.
 * @returns {number} Insert index.
 */
function ciFindTailwindSourceInsertIndex(lines) {
  const lastSourceIndex = lines.findLastIndex((line) =>
    line.trim().startsWith("@source "),
  );

  if (lastSourceIndex >= 0) {
    return lastSourceIndex + 1;
  }

  const lastImportIndex = lines.findLastIndex((line) =>
    line.trim().startsWith("@import "),
  );

  if (lastImportIndex >= 0) {
    return lastImportIndex + 1;
  }

  return 0;
}

/**
 * Updates the application template globals.css Tailwind @source line
 * for the current package according to the selected target.
 */
function updateAppTemplateGlobalsCssSource() {
  const globalsCssPath = ciResolveAppTemplateGlobalsCssPath();

  if (!fs.existsSync(globalsCssPath)) {
    console.warn(`⚠️ App template globals.css not found: ${globalsCssPath}`);
    return;
  }

  const originalText = fs.readFileSync(globalsCssPath, "utf8");
  const lineEnding = originalText.includes("\r\n") ? "\r\n" : "\n";
  const hasFinalNewline = originalText.endsWith("\n");

  const nextSourceLine = ciBuildTailwindSourceLine(globalsCssPath);

  const lines = originalText
    .split(/\r?\n/)
    .filter((line) => !ciIsTailwindSourceLineForCurrentPackage(line));

  const insertIndex = ciFindTailwindSourceInsertIndex(lines);
  lines.splice(insertIndex, 0, nextSourceLine);

  const nextText = lines.join(lineEnding);

  fs.writeFileSync(
    globalsCssPath,
    hasFinalNewline ? nextText.replace(/\r?\n?$/, lineEnding) : nextText,
  );

  console.log(`Updated app template globals.css @source for ${pkg.name}`);
}

// ------------------------------------------------------------------------------------
// main rewrite
// ------------------------------------------------------------------------------------
for (const key of Object.keys(pkg.exports ?? {})) {
  const entry = pkg.exports[key];
  const normalizedKey = normalizeKey(key);
  const rule = findRuleForKey(key);

  if (rule?.spec?.exact === true) {
    pkg.exports[key] = buildExactObject(rule.spec, rule.match, target);
    continue;
  }

  if (typeof entry === "string") {
    let mapped = null;

    if (rule) {
      mapped = mapCondition(rule.spec, rule.match, "import");
    }

    const specialPath = getSpecialExportPath(normalizedKey);

    if (mapped) {
      pkg.exports[key] = mapped;
    } else if (specialPath) {
      pkg.exports[key] = specialPath;
    } else if (isCssExport(entry)) {
      pkg.exports[key] = replaceCssPath(entry);
    } else {
      pkg.exports[key] = replaceCodePath(entry);
    }

    continue;
  }

  if (entry && typeof entry === "object") {
    const specialPath = getSpecialExportPath(normalizedKey);

    if (!rule && specialPath) {
      for (const condition of Object.keys(entry)) {
        pkg.exports[key][condition] = specialPath;
      }

      continue;
    }

    const conditions = ["import", "require", "default", "types"];

    for (const condition of conditions) {
      const value = entry[condition];

      if (rule) {
        const mapped = mapCondition(rule.spec, rule.match, condition);

        if (mapped) {
          pkg.exports[key][condition] = mapped;
          continue;
        }
      }

      if (typeof value !== "string") continue;

      if (isCssExport(value)) {
        pkg.exports[key][condition] = replaceCssPath(value);
      } else if (condition === "types") {
        pkg.exports[key][condition] =
          getSpecialExportPath(normalizedKey) ??
          inferTypesFromCodePath(replaceCodePath(value));
      } else {
        pkg.exports[key][condition] = replaceCodePath(value);
      }
    }

    const codePath =
      pkg.exports[key].import ||
      pkg.exports[key].require ||
      pkg.exports[key].default;

    if (!pkg.exports[key].types && typeof codePath === "string") {
      const inferred = inferTypesFromCodePath(codePath);
      if (inferred) pkg.exports[key].types = inferred;
    }
  }
}

if (target === "src") {
  pkg.files = config.packageFiles?.src ?? ["src"];
  pkg.main = config.packageMain?.src ?? "./src/index.ts";
  pkg.module = config.packageModule?.src ?? "./src/index.ts";
} else {
  pkg.files = config.packageFiles?.dist ?? ["dist"];
  pkg.main = config.packageMain?.dist ?? "./dist/index.js";
  pkg.module = config.packageModule?.dist ?? "./dist/index.js";
}

const topLevelTypesPath = getSpecialExportPath("types");

if (pkg.types && typeof pkg.types === "string" && topLevelTypesPath) {
  pkg.types = topLevelTypesPath;
}

updateAppTemplateTsconfigAlias();
updateCurrentPackageTsconfigAliases();
updateAppTemplateGlobalsCssSource();

writeJsonFile(pkgPath, pkg);

console.log(
  `Switched ${config.packageName ?? pkg.name} exports to ./${target}`,
);
// ------------------------------------------------------------------------------------
