#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { readdir, rm, mkdir, cp, copyFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const cwd = process.cwd();

const srcStylesDir = path.join(cwd, "src", "styles");
const destStylesDir = path.join(cwd, "dist", "styles");

const srcLocaleDir = path.join(cwd, "src", "locales");
const destLocaleDir = path.join(cwd, "dist", "locales");

/**
 * Emits a marked output section for the shared build runner.
 *
 * @param {"tree" | "block" | "plain"} mode - Output rendering mode.
 * @param {string[]} lines - Output lines.
 */
function ciEmitOutputSection(mode, lines) {
  const cleanLines = lines.filter((line) => line.trim() !== "");

  if (cleanLines.length === 0) return;

  console.log(`::ci-output ${mode}`);
  console.log(cleanLines.join("\n"));
  console.log("::ci-output-end");
}

/**
 * Checks whether a path exists.
 *
 * @param {string} targetPath - Path to check.
 * @returns {boolean} Whether the path exists.
 */
function ciPathExists(targetPath) {
  return fs.existsSync(targetPath);
}

/**
 * Builds a Tailwind CSS file.
 *
 * @param {string} inputCssFile - Input CSS file.
 * @param {string} outputCssFile - Output CSS file.
 */
function ciBuildTailwindCss(inputCssFile, outputCssFile) {
  const result = spawnSync(
    "pnpm",
    [
      "exec",
      "tailwindcss",
      "-i",
      inputCssFile,
      "-o",
      outputCssFile,
      "--minify",
    ],
    {
      cwd,
      shell: false,
      stdio: ["inherit", "pipe", "pipe"],
      encoding: "utf8",
      env: {
        ...process.env,
        FORCE_COLOR: "1",
      },
    },
  );

  if (result.error) {
    console.error("❌ Failed to start Tailwind CSS CLI.");
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    if (result.stdout?.trim()) {
      console.log(result.stdout.trimEnd());
    }

    if (result.stderr?.trim()) {
      console.error(result.stderr.trimEnd());
    }

    console.error("❌ Tailwind CSS build failed.");
    console.error(`Input:  ${inputCssFile}`);
    console.error(`Output: ${outputCssFile}`);

    process.exit(result.status ?? 1);
  }
}

/**
 * Copies the source theme entry file and modular theme folder.
 *
 * This intentionally copies only:
 * - theme.css
 * - theme/**
 *
 * It does not copy other root-level CSS files beside the compiled style.css.
 *
 * @param {object} input - Copy input.
 * @param {string} input.themeSrcDir - Source style theme directory.
 * @param {string} input.outputThemeDir - Destination style theme directory.
 * @returns {Promise<{ copiedThemeCss: boolean; copiedThemeFolder: boolean }>}
 */
async function ciCopyThemeSourceAssets({ themeSrcDir, outputThemeDir }) {
  const srcThemeCss = path.join(themeSrcDir, "theme.css");
  const destThemeCss = path.join(outputThemeDir, "theme.css");

  const srcThemeFolder = path.join(themeSrcDir, "theme");
  const destThemeFolder = path.join(outputThemeDir, "theme");

  let copiedThemeCss = false;
  let copiedThemeFolder = false;

  if (ciPathExists(srcThemeCss)) {
    await copyFile(srcThemeCss, destThemeCss);
    copiedThemeCss = true;
  }

  if (ciPathExists(srcThemeFolder)) {
    await cp(srcThemeFolder, destThemeFolder, {
      recursive: true,
    });

    copiedThemeFolder = true;
  }

  return {
    copiedThemeCss,
    copiedThemeFolder,
  };
}

/**
 * Builds package theme styles.
 *
 * Expected source structure:
 *
 * src/styles/<theme-name>/
 *   style.css
 *   theme.css
 *   theme/
 *     foundations/*.css
 *     colors/*.css
 *     utilities/*.css
 *
 * Output structure:
 *
 * dist/styles/<theme-name>/
 *   style.css
 *   theme.css
 *   theme/
 *     foundations/*.css
 *     colors/*.css
 *     utilities/*.css
 *
 * @returns {Promise<{
 *   builtThemes: Array<{
 *     name: string;
 *     copiedThemeCss: boolean;
 *     copiedThemeFolder: boolean;
 *   }>;
 *   skippedThemes: string[];
 * }>}
 */
async function ciBuildStyles() {
  const builtThemes = [];
  const skippedThemes = [];

  if (!ciPathExists(srcStylesDir)) {
    ciEmitOutputSection("tree", ["⚠️ No styles source folder found."]);

    return {
      builtThemes,
      skippedThemes,
    };
  }

  await rm(destStylesDir, {
    recursive: true,
    force: true,
  });

  await mkdir(destStylesDir, {
    recursive: true,
  });

  const entries = await readdir(srcStylesDir, {
    withFileTypes: true,
  });

  const themes = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  if (themes.length === 0) {
    ciEmitOutputSection("tree", ["⚠️ No style themes found."]);

    return {
      builtThemes,
      skippedThemes,
    };
  }

  for (const theme of themes) {
    const themeSrcDir = path.join(srcStylesDir, theme);
    const outputThemeDir = path.join(destStylesDir, theme);

    const inputCssFile = path.join(themeSrcDir, "style.css");
    const outputCssFile = path.join(outputThemeDir, "style.css");

    if (!ciPathExists(inputCssFile)) {
      skippedThemes.push(theme);
      continue;
    }

    await mkdir(outputThemeDir, {
      recursive: true,
    });

    ciBuildTailwindCss(inputCssFile, outputCssFile);

    const { copiedThemeCss, copiedThemeFolder } = await ciCopyThemeSourceAssets(
      {
        themeSrcDir,
        outputThemeDir,
      },
    );

    builtThemes.push({
      name: theme,
      copiedThemeCss,
      copiedThemeFolder,
    });
  }

  return {
    builtThemes,
    skippedThemes,
  };
}

/**
 * Copies locale assets from src/locales to dist/locales while preserving
 * root-level build-generated files.
 *
 * @returns {Promise<{ copied: boolean; copiedFiles: number }>}
 */
async function ciCopyLocales() {
  if (!ciPathExists(srcLocaleDir)) {
    ciEmitOutputSection("tree", ["⚠️ No locale source folder found."]);

    return {
      copied: false,
      copiedFiles: 0,
    };
  }

  await mkdir(destLocaleDir, {
    recursive: true,
  });

  const destinationEntries = await readdir(destLocaleDir, {
    withFileTypes: true,
  });

  for (const entry of destinationEntries) {
    const fullPath = path.join(destLocaleDir, entry.name);

    if (
      entry.isFile() &&
      (entry.name.endsWith(".ts") ||
        entry.name.endsWith(".js") ||
        entry.name.endsWith(".map"))
    ) {
      continue;
    }

    await rm(fullPath, {
      recursive: true,
      force: true,
    });
  }

  let copiedFiles = 0;

  await cp(srcLocaleDir, destLocaleDir, {
    recursive: true,
    filter: (source) => {
      const stat = fs.statSync(source);

      if (stat.isDirectory()) return true;

      const shouldCopy = source.endsWith(".json") || source.endsWith(".d.ts");

      if (shouldCopy) {
        copiedFiles++;
      }

      return shouldCopy;
    },
  });

  return {
    copied: true,
    copiedFiles,
  };
}

/**
 * Builds package CSS and locale assets.
 */
async function ciBuildNextAppAssets() {
  const { builtThemes, skippedThemes } = await ciBuildStyles();
  const { copied, copiedFiles } = await ciCopyLocales();

  const outputLines = [];

  if (builtThemes.length > 0) {
    for (const theme of builtThemes) {
      const copiedAssets = [];

      if (theme.copiedThemeCss) {
        copiedAssets.push("theme.css");
      }

      if (theme.copiedThemeFolder) {
        copiedAssets.push("theme/");
      }

      outputLines.push(
        `Built CSS theme: ${theme.name} (${
          copiedAssets.join(", ") || "no source theme assets"
        } copied)`,
      );
    }
  }

  for (const theme of skippedThemes) {
    outputLines.push(`⚠️ Skipped theme without style.css: ${theme}`);
  }

  if (copied) {
    outputLines.push(`Copied locale assets: ${copiedFiles} file(s)`);
  }

  ciEmitOutputSection("tree", outputLines);
}

ciBuildNextAppAssets().catch((error) => {
  console.error("❌ Failed to build package assets.");
  console.error(error);
  process.exit(1);
});
