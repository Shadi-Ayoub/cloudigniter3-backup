// CloudIgniter internal client-directive scan worker.
import fs from "node:fs";
import path from "node:path";

const DIST_DIR = path.resolve(process.cwd(), "dist");

/**
 * React APIs that are not allowed in React Server Components unless the file
 * is explicitly marked as a Client Component boundary.
 */
const REACT_CLIENT_APIS = [
  "createContext",
  "useState",
  "useEffect",
  "useLayoutEffect",
  "useInsertionEffect",
  "useReducer",
  "useRef",
  "useContext",
  "useImperativeHandle",
  "useSyncExternalStore",
];

/**
 * Browser-only globals. These do not always mean a React Client Component is
 * required, but they are strong indicators that the file is not server-safe.
 */
const BROWSER_GLOBALS = [
  "window",
  "document",
  "localStorage",
  "sessionStorage",
  "navigator",
  "matchMedia",
];

/**
 * Packages that usually indicate client-only behavior.
 */
const CLIENT_SIDE_PACKAGES = ["js-cookie", "next-themes", "zustand"];

/**
 * Returns true if a compiled JS file starts with "use client".
 *
 * @param {string} content
 * @returns {boolean}
 */
function ciHasUseClientDirective(content) {
  const trimmed = content.trimStart();

  return (
    trimmed.startsWith('"use client";') ||
    trimmed.startsWith("'use client';") ||
    trimmed.startsWith('"use client"') ||
    trimmed.startsWith("'use client'")
  );
}

/**
 * Escapes a string for safe use inside RegExp.
 *
 * @param {string} value
 * @returns {string}
 */
function ciEscapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Recursively collects .js files under a directory.
 *
 * @param {string} dir
 * @returns {string[]}
 */
function ciCollectJsFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const files = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...ciCollectJsFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Detects named React imports such as:
 *
 * import { createContext, useState } from "react";
 * import React, { createContext as cc } from "react";
 *
 * @param {string} content
 * @returns {string[]}
 */
function ciFindReactClientImports(content) {
  const matches = new Set();

  const reactImportRegex =
    /import\s+(?:[^;]*?\{([^}]+)\}[^;]*?)\s+from\s+["']react["']/g;

  let match;

  while ((match = reactImportRegex.exec(content))) {
    const namedImports = match[1] ?? "";

    for (const api of REACT_CLIENT_APIS) {
      const apiRegex = new RegExp(`\\b${ciEscapeRegExp(api)}\\b`);

      if (apiRegex.test(namedImports)) {
        matches.add(api);
      }
    }
  }

  return [...matches];
}

/**
 * Detects compiled or direct symbol usage.
 *
 * This catches output like:
 * import React from "react";
 * var ctx = React.createContext(...)
 *
 * or bundled/minified aliases where the exact symbol name still appears.
 *
 * @param {string} content
 * @returns {string[]}
 */
function ciFindReactClientSymbolUsage(content) {
  const matches = new Set();

  for (const api of REACT_CLIENT_APIS) {
    const regex = new RegExp(`\\b${ciEscapeRegExp(api)}\\b`);

    if (regex.test(content)) {
      matches.add(api);
    }
  }

  return [...matches];
}

/**
 * Detects browser global references.
 *
 * @param {string} content
 * @returns {string[]}
 */
function ciFindBrowserGlobals(content) {
  const matches = new Set();

  for (const globalName of BROWSER_GLOBALS) {
    const regex = new RegExp(`\\b${ciEscapeRegExp(globalName)}\\b`);

    if (regex.test(content)) {
      matches.add(globalName);
    }
  }

  return [...matches];
}

/**
 * Detects imports from known client-side packages.
 *
 * @param {string} content
 * @returns {string[]}
 */
function ciFindClientSidePackages(content) {
  const matches = new Set();

  for (const packageName of CLIENT_SIDE_PACKAGES) {
    const escaped = ciEscapeRegExp(packageName);

    const importRegex = new RegExp(
      `(?:from\\s+["']${escaped}["']|import\\s+["']${escaped}["'])`,
    );

    if (importRegex.test(content)) {
      matches.add(packageName);
    }
  }

  return [...matches];
}

/**
 * Finds client-only signals in a compiled JS file.
 *
 * @param {string} content
 * @returns {{
 *   critical: string[];
 *   strong: string[];
 *   medium: string[];
 * }}
 */
function ciFindClientOnlySignals(content) {
  const reactImports = ciFindReactClientImports(content);
  const reactSymbols = ciFindReactClientSymbolUsage(content);
  const browserGlobals = ciFindBrowserGlobals(content);
  const clientPackages = ciFindClientSidePackages(content);

  return {
    critical: [...new Set([...reactImports, ...reactSymbols])],
    strong: browserGlobals,
    medium: clientPackages,
  };
}

const files = ciCollectJsFiles(DIST_DIR);
const offenders = [];

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");

  if (ciHasUseClientDirective(content)) {
    continue;
  }

  const signals = ciFindClientOnlySignals(content);

  if (
    signals.critical.length > 0 ||
    signals.strong.length > 0 ||
    signals.medium.length > 0
  ) {
    offenders.push({
      file,
      signals,
    });
  }
}

if (offenders.length === 0) {
  console.log('✅ No missing "use client" directives found.');
  process.exit(0);
}

console.error(
  `❌ Found ${offenders.length} JS file(s) missing "use client":\n`,
);

for (const offender of offenders) {
  console.error(path.relative(process.cwd(), offender.file));

  if (offender.signals.critical.length > 0) {
    console.error("  Critical React client APIs:");
    for (const signal of offender.signals.critical) {
      console.error(`    - ${signal}`);
    }
  }

  if (offender.signals.strong.length > 0) {
    console.error("  Strong browser-only signals:");
    for (const signal of offender.signals.strong) {
      console.error(`    - ${signal}`);
    }
  }

  if (offender.signals.medium.length > 0) {
    console.error("  Medium client-side package signals:");
    for (const signal of offender.signals.medium) {
      console.error(`    - ${signal}`);
    }
  }

  console.error("");
}

process.exit(1);
