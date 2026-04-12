#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import fg from "fast-glob";
import JavaScriptObfuscator from "javascript-obfuscator";

const cwd = process.cwd();
const distDir = path.join(cwd, "dist");

const defaultConfig = {
  compact: true,
  stringArray: true,
  stringArrayThreshold: 0.75,
  rotateStringArray: true,
  stringArrayEncoding: ["base64"],
  controlFlowFlattening: false,
  controlFlowFlatteningThreshold: 0,
};

const configPath = path.join(cwd, "obfuscator.config.json");

async function loadConfig() {
  try {
    const raw = await fs.readFile(configPath, "utf8");
    return { ...defaultConfig, ...JSON.parse(raw) };
  } catch {
    return defaultConfig;
  }
}

function shouldSkip(filePath) {
  const normalized = filePath.replace(/\\/g, "/");

  if (normalized.endsWith(".d.ts")) return true;
  if (normalized.endsWith(".map")) return true;
  if (normalized.endsWith(".json")) return true;
  if (normalized.endsWith(".css")) return true;

  return false;
}

async function main() {
  const config = await loadConfig();

  const files = await fg(["dist/**/*.{js,cjs,mjs}"], {
    cwd,
    absolute: true,
    onlyFiles: true,
  });

  let processed = 0;

  for (const file of files) {
    if (shouldSkip(file)) continue;

    const source = await fs.readFile(file, "utf8");
    const result = JavaScriptObfuscator.obfuscate(source, {
      ...config,
      inputFileName: path.relative(cwd, file),
    });

    await fs.writeFile(file, result.getObfuscatedCode(), "utf8");
    processed++;
    console.log(`🔒 Obfuscated: ${path.relative(cwd, file)}`);
  }

  console.log(`✅ Obfuscated ${processed} runtime file(s).`);
}

main().catch((error) => {
  console.error("❌ Obfuscation failed.");
  console.error(error);
  process.exit(1);
});
