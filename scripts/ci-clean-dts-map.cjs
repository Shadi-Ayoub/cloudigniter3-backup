#!/usr/bin/env node

// clean-dts.cjs
/**
 * In case a mistake happens in the declaration build process,
 * we need to delete all generated *.d.ts and *.d.ts.map files
 * from the project EXCEPT the ./dist folder.
 */

const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");

/**
 * Recursively delete all *.d.ts and *.d.ts.map files
 * while skipping the ./dist folder entirely.
 *
 * @param {string} dir
 */
function deleteDtsFiles(dir) {
  // Skip the dist folder completely
  if (path.resolve(dir) === path.resolve(distDir)) {
    console.log(`⏭️ Skipping dist folder: ${dir}`);
    return;
  }

  // Read directory entries with their types
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip node_modules for safety/performance
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") {
        console.log(`⏭️ Skipping node_modules: ${fullPath}`);
        continue;
      }

      // Recurse into sub-folder
      deleteDtsFiles(fullPath);
      continue;
    }

    if (
      entry.isFile() &&
      (entry.name.endsWith(".d.ts") || entry.name.endsWith(".d.ts.map"))
    ) {
      try {
        fs.unlinkSync(fullPath);
        console.log(`🗑️ Deleted: ${fullPath}`);
      } catch (err) {
        console.error(`❌ Failed to delete ${fullPath}:`, err);
      }
    }
  }
}

if (!fs.existsSync(projectRoot)) {
  console.error(`❌ ERROR: Project root not found at ${projectRoot}`);
  process.exit(1);
}

console.log(
  `🔍 Cleaning generated declaration files under ${projectRoot} (excluding ./dist)...`,
);

deleteDtsFiles(projectRoot);

console.log("✅ Done.");
