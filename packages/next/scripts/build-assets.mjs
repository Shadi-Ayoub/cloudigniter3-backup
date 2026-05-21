#!/usr/bin/env node
import { readdir, rm, mkdir, copyFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const srcStylesDir = path.join(cwd, "src/ui/styles");
const distStylesDir = path.join(cwd, "dist/styles");
const srcLocaleDir = path.join(cwd, "src/i18n/locale");
const distLocaleDir = path.join(cwd, "dist/locale");

async function ciBuildStyles() {
  console.log("ℹ️ Building the default styles folder.");

  if (!fs.existsSync(srcStylesDir)) {
    console.log("ℹ️ No styles folder found.");
    return;
  }

  console.log("ℹ️ Styles source path:", srcStylesDir);
  console.log("ℹ️ Styles destination path:", distStylesDir);

  await rm(distStylesDir, { recursive: true, force: true });
  await mkdir(distStylesDir, { recursive: true });

  const entries = await readdir(srcStylesDir, { withFileTypes: true });
  const themes = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  for (const theme of themes) {
    const themeSrcDir = path.join(srcStylesDir, theme);
    const outputThemeDir = path.join(distStylesDir, theme);
    const inputCssFile = path.join(themeSrcDir, "style.css");
    const outputCssFile = path.join(outputThemeDir, "style.css");
    const srcThemeCss = path.join(themeSrcDir, "theme.css");
    const destThemeCss = path.join(outputThemeDir, "theme.css");

    if (!fs.existsSync(inputCssFile)) continue;

    execSync(
      `npx @tailwindcss/cli -i "${inputCssFile}" -o "${outputCssFile}" --minify`,
      {
        stdio: "inherit",
      },
    );

    // await mkdir(outputThemeDir, { recursive: true });

    if (fs.existsSync(srcThemeCss)) {
      await copyFile(srcThemeCss, destThemeCss);
    } else {
      console.log("ℹ️ No styles folder found.");
    }

    console.log(`✅ Built theme: ${theme}`);
  }
}

async function ciCopyLocales() {
  console.log("ℹ️ Copying the default locale folder.");

  if (!fs.existsSync(srcLocaleDir)) {
    console.log("ℹ️ No locale folder found.");
    return;
  }

  await rm(distLocaleDir, { recursive: true, force: true });
  await mkdir(distLocaleDir, { recursive: true });

  fs.cpSync(srcLocaleDir, distLocaleDir, {
    recursive: true,
    filter: (source) => {
      return (
        fs.statSync(source).isDirectory() ||
        source.endsWith(".json") ||
        source.endsWith(".d.ts")
      );
    },
  });

  console.log("✅ Copied locale assets.");
}

(async () => {
  await ciBuildStyles();
  await ciCopyLocales();
})();
