import path from "path";
import { promises as fs } from "fs";

import type { CiSeederItemKey } from "@ci-core/types";

// Folder required by your requirement
const MOCKS_DIR = path.join(process.cwd(), "src", "custom", "testing", "mocks");
/**
 * Baseline rule:
 * - Look for JSON files matching:
 *   - `${item}-mock.json`
 *   - OR any file that ends with `-mock.json` and starts with `${item}`
 *
 * You can extend to TS modules later (dynamic import) if you decide to allow `export default`.
 */
export async function ciReadMocksForItem(
  item: CiSeederItemKey,
): Promise<unknown> {
  const files = await fs.readdir(MOCKS_DIR);

  // Prefer explicit `${item}-mock.json`
  const preferred = `${item}-mock.json`;
  const exact = files.find((f) => f === preferred);

  const match =
    exact ??
    files.find((f) => f.startsWith(`${item}-`) && f.endsWith("-mock.json")) ??
    files.find(
      (f) => f.startsWith(item) && f.includes("-mock") && f.endsWith(".json"),
    );

  if (!match) {
    throw new Error(`No mock file found for item "${item}" in ${MOCKS_DIR}`);
  }

  const fullPath = path.join(MOCKS_DIR, match);
  const raw = await fs.readFile(fullPath, "utf8");

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON in mock file: ${match}`);
  }
}
