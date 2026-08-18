#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const cwd = process.cwd();

async function ciRemove(target) {
  await fs.rm(path.join(cwd, target), {
    recursive: true,
    force: true,
  });
}

await ciRemove("dist");
await ciRemove(".tsbuildinfo");

console.log("Removed dist and .tsbuildinfo.");
