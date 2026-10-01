#!/usr/bin/env node

/**
 * Tests a Tailwind style build by compiling the selected style
 * into a temporary CSS file.
 *
 * Usage:
 *   node ./scripts/ci-test-style.mjs standard
 *
 * If no style name is provided, "standard" is used.
 */

import { spawnSync } from "node:child_process";

let styleName = process.argv[2];

if (!styleName) {
  styleName = "standard";

  console.warn("");
  console.warn("⚠ No style name was provided.");
  console.warn(`⚠ Falling back to default style: "${styleName}".`);
  console.warn("⚠ Usage: node ./scripts/ci-test-style.mjs <style-name>");
  console.warn("");
}

const inputFile = `./src/styles/${styleName}/style.css`;
const outputFile = "./tmp.css";

console.log("");
console.log(`▶ Testing style: ${styleName}`);
console.log(`▶ Input : ${inputFile}`);
console.log(`▶ Output: ${outputFile}`);
console.log("");

const result = spawnSync(
  "pnpm",
  ["exec", "tailwindcss", "-i", inputFile, "-o", outputFile],
  {
    stdio: "inherit",
    shell: true,
  },
);

if (result.status === 0) {
  console.log("");
  console.log(`✔ Style "${styleName}" compiled successfully.`);
  console.log(`✔ Output written to ${outputFile}`);
  console.log("");
}

process.exit(result.status ?? 1);
