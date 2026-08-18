// CloudIgniter internal client-file listing worker.
import fs from "node:fs";
import path from "node:path";

const targetArg = process.argv[2];

if (!targetArg) {
  console.error("❌ Usage: ci-dev quality list-client-files --root=<folder>");
  console.error("Example: ci-dev quality list-client-files --root=src/layout");
  process.exit(1);
}

const ROOT_DIR = process.cwd();
const TARGET_DIR = path.resolve(ROOT_DIR, targetArg);

const CLIENT_SIGNALS = [
  /\b"use client"\b/,
  /\b'use client'\b/,
  /\bcreateContext\b/,
  /\buseState\b/,
  /\buseEffect\b/,
  /\buseLayoutEffect\b/,
  /\buseInsertionEffect\b/,
  /\buseReducer\b/,
  /\buseRef\b/,
  /\buseContext\b/,
  /\buseImperativeHandle\b/,
  /\buseSyncExternalStore\b/,
  /\bwindow\b/,
  /\bdocument\b/,
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
  /\bnavigator\b/,
  /\bmatchMedia\b/,
  /from\s+["']js-cookie["']/,
  /from\s+["']next-themes["']/,
  /from\s+["']zustand["']/,
];

/**
 * Removes JS/TS comments while preserving strings reasonably well.
 *
 * @param {string} source
 * @returns {string}
 */
function ciStripComments(source) {
  let result = "";

  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inTemplateLiteral = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < source.length; i++) {
    const current = source[i];
    const next = source[i + 1];
    const previous = source[i - 1];

    if (inLineComment) {
      if (current === "\n") {
        inLineComment = false;
        result += current;
      }
      continue;
    }

    if (inBlockComment) {
      if (current === "*" && next === "/") {
        inBlockComment = false;
        i++;
      }
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && !inTemplateLiteral) {
      if (current === "/" && next === "/") {
        inLineComment = true;
        i++;
        continue;
      }

      if (current === "/" && next === "*") {
        inBlockComment = true;
        i++;
        continue;
      }
    }

    if (
      current === "'" &&
      !inDoubleQuote &&
      !inTemplateLiteral &&
      previous !== "\\"
    ) {
      inSingleQuote = !inSingleQuote;
    } else if (
      current === '"' &&
      !inSingleQuote &&
      !inTemplateLiteral &&
      previous !== "\\"
    ) {
      inDoubleQuote = !inDoubleQuote;
    } else if (
      current === "`" &&
      !inSingleQuote &&
      !inDoubleQuote &&
      previous !== "\\"
    ) {
      inTemplateLiteral = !inTemplateLiteral;
    }

    result += current;
  }

  return result;
}

/**
 * Recursively collects source files.
 *
 * @param {string} dir
 * @returns {string[]}
 */
function ciCollectSourceFiles(dir) {
  if (!fs.existsSync(dir)) return [];

  const files = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...ciCollectSourceFiles(fullPath));
      continue;
    }

    if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Returns matched client signals.
 *
 * @param {string} content
 * @returns {string[]}
 */
function ciFindClientSignals(content) {
  return CLIENT_SIGNALS.filter((pattern) => pattern.test(content)).map(String);
}

const files = ciCollectSourceFiles(TARGET_DIR);
const clientFiles = [];

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  const uncommentedContent = ciStripComments(content);
  const signals = ciFindClientSignals(uncommentedContent);

  if (signals.length > 0) {
    clientFiles.push({
      file: path.relative(ROOT_DIR, file),
      signals,
    });
  }
}

if (clientFiles.length === 0) {
  console.log(`✅ No client files detected under ${targetArg}`);
  process.exit(0);
}

console.log(
  `Found ${clientFiles.length} client-like file(s) under ${targetArg}:\n`,
);

for (const item of clientFiles) {
  console.log(item.file);

  for (const signal of item.signals) {
    console.log(`  - ${signal}`);
  }

  console.log("");
}
