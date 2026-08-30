import { promises as fs } from "node:fs";
import path from "node:path";
import type { CiSeederDefinition } from "@ci-core/types";

export type CiReadJsonSeederDataInput = {
  appRoot?: string;
  customSeederRoot?: string;
  definition: CiSeederDefinition;
  maxFileBytes?: number;
};

function assertContainedPath(root: string, target: string, label: string): void {
  const relative = path.relative(root, target);
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    return;
  }
  throw new Error(`${label} must remain inside the configured seeder root.`);
}

function assertDefinition(definition: CiSeederDefinition): void {
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(definition.id)) {
    throw new Error(`Seeder ID "${definition.id}" must use lowercase kebab case.`);
  }
  if (definition.dataFiles.length === 0) {
    throw new Error(`Seeder "${definition.id}" must declare at least one JSON data file.`);
  }
}

/**
 * Reads and merges array-shaped JSON fixtures from an application custom seam.
 * Paths are resolved and confined beneath `src/custom/dev/seeder` by default.
 */
export async function ciReadJsonSeederData<T = unknown>({
  appRoot = process.cwd(),
  customSeederRoot = "src/custom/dev/seeder",
  definition,
  maxFileBytes = 1_048_576,
}: CiReadJsonSeederDataInput): Promise<T[]> {
  assertDefinition(definition);
  const root = path.resolve(appRoot, customSeederRoot);
  const dataDirectory = path.resolve(root, definition.dataDirectory);
  assertContainedPath(root, dataDirectory, "Seeder data directory");

  const merged: T[] = [];
  for (const dataFile of definition.dataFiles) {
    if (path.extname(dataFile).toLowerCase() !== ".json") {
      throw new Error(`Seeder data file "${dataFile}" must use the .json extension.`);
    }
    const filePath = path.resolve(dataDirectory, dataFile);
    assertContainedPath(dataDirectory, filePath, "Seeder data file");
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      throw new Error(`Seeder data path "${dataFile}" is not a regular file.`);
    }
    if (stats.size > maxFileBytes) {
      throw new Error(
        `Seeder data file "${dataFile}" exceeds the ${maxFileBytes}-byte limit.`,
      );
    }
    const parsed = JSON.parse(await fs.readFile(filePath, "utf8")) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error(`Seeder data file "${dataFile}" must contain a JSON array.`);
    }
    merged.push(...(parsed as T[]));
  }
  return merged;
}
