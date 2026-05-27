#!/usr/bin/env node
import { readdir, rm, mkdir, copyFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const srcStylesDir = path.join(cwd, "src/styles");
const destStylesDir = path.join(cwd, "dist/styles");
const srcLocaleDir = path.join(cwd, "src/locales");
const destLocaleDir = path.join(cwd, "dist/locales");

async function ciBuildStyles() {
  console.log("ℹ️ Building the default styles folder.");

  if (!fs.existsSync(srcStylesDir)) {
    console.log("ℹ️ No styles folder found.");
    return;
  }

  console.log("ℹ️ Styles source path:", srcStylesDir);
  console.log("ℹ️ Styles destination path:", destStylesDir);

  await rm(destStylesDir, { recursive: true, force: true });
  await mkdir(destStylesDir, { recursive: true });

  const entries = await readdir(srcStylesDir, { withFileTypes: true });
  const themes = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  for (const theme of themes) {
    const themeSrcDir = path.join(srcStylesDir, theme);
    const outputThemeDir = path.join(destStylesDir, theme);
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

  // Ensure destination exists first.
  if (!fs.existsSync(destLocaleDir)) {
    fs.mkdirSync(destLocaleDir, { recursive: true });
  }

  // else {
  //   // Remove everything inside destination, but keep the folder
  //   for (const entry of fs.readdirSync(destLocaleDir)) {
  //     fs.rmSync(path.join(destLocaleDir, entry), {
  //       recursive: true,
  //       force: true,
  //     });
  //   }
  // }

  // fs.cpSync(srcLocaleDir, destLocaleDir, {
  //   recursive: true,
  //   filter: (source) => {
  //     return (
  //       fs.statSync(source).isDirectory() ||
  //       source.endsWith(".json") ||
  //       source.endsWith(".d.ts")
  //     );
  //   },
  // });

  if (fs.existsSync(destLocaleDir)) {
    for (const entry of fs.readdirSync(destLocaleDir)) {
      const fullPath = path.join(destLocaleDir, entry);
      const stat = fs.statSync(fullPath);

      // Keep only root-level build files
      if (
        stat.isFile() &&
        (entry.endsWith(".ts") ||
          entry.endsWith(".js") ||
          entry.endsWith(".map"))
      ) {
        continue;
      }

      fs.rmSync(fullPath, {
        recursive: true,
        force: true,
      });
    }
  }

  fs.cpSync(srcLocaleDir, destLocaleDir, {
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
