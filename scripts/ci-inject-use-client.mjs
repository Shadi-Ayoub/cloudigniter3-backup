import fs from "node:fs";
import path from "node:path";

/**
 * Injects "use client" into compiled files if not already present.
 *
 * @param {string[]} targets
 */
export async function ciInjectUseClient(targets) {
  for (const target of targets) {
    const filePath = path.resolve(target);

    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ File not found: ${filePath}`);
      continue;
    }

    const content = fs.readFileSync(filePath, "utf8");

    if (content.startsWith('"use client";')) {
      continue;
    }

    fs.writeFileSync(filePath, `"use client";\n${content}`, "utf8");

    console.log(
      `⚡️ Successfully injected "use client" into ${path.basename(filePath)}`,
    );
  }
}
