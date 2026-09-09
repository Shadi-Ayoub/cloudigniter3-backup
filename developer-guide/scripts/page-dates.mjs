import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const sourceRoots = [
  "developer-guide/docs",
  "developer-guide/company-developers",
  "developer-guide/dictionary",
  ".agents/skills",
  ".codex/skills",
];

export function collectPageHashes(repositoryRoot) {
  const hashes = {};
  function visit(directory, extensions) {
    if (!fs.existsSync(directory)) return;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const isCategory =
        /^_category_\.(json|yml|yaml)$/.test(entry.name) &&
        extensions.includes(".mdx");
      if (
        entry.name.startsWith(".") ||
        (entry.name.startsWith("_") && !isCategory)
      )
        continue;
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(filename, extensions);
      else if (
        entry.isFile() &&
        (isCategory || extensions.includes(path.extname(entry.name)))
      ) {
        const source = path
          .relative(repositoryRoot, filename)
          .split(path.sep)
          .join("/");
        hashes[source] = createHash("sha256")
          .update(fs.readFileSync(filename))
          .digest("hex");
      }
    }
  }
  for (const root of sourceRoots) {
    visit(
      path.join(repositoryRoot, root),
      root.startsWith(".") ? [".md"] : [".md", ".mdx"],
    );
  }
  return hashes;
}

function isTimestamp(value) {
  return (
    typeof value === "string" &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}

export function validateRegistry(registry) {
  if (
    registry?.version !== 1 ||
    !registry.pages ||
    typeof registry.pages !== "object" ||
    Array.isArray(registry.pages)
  ) {
    throw new Error(
      "Invalid page-dates.json: expected version 1 and a pages object.",
    );
  }
  for (const [source, dates] of Object.entries(registry.pages)) {
    if (
      !dates ||
      !isTimestamp(dates.createdAt) ||
      !isTimestamp(dates.updatedAt) ||
      dates.createdAt > dates.updatedAt ||
      typeof dates.contentHash !== "string" ||
      !/^[a-f0-9]{64}$/.test(dates.contentHash)
    ) {
      throw new Error(
        `Invalid page dates for ${source}: require UTC ISO timestamps, updatedAt >= createdAt, and a SHA-256 contentHash.`,
      );
    }
  }
}

export function updatePageDates(hashes, registry, timestamp) {
  validateRegistry(registry);
  if (!isTimestamp(timestamp)) throw new Error("Use a UTC ISO timestamp.");
  const pages = {};
  for (const source of Object.keys(hashes).sort()) {
    const previous = registry.pages[source];
    if (previous?.contentHash === hashes[source]) {
      pages[source] = previous;
      continue;
    }
    if (previous && timestamp < previous.updatedAt) {
      throw new Error(`Cannot move updatedAt backwards for ${source}.`);
    }
    pages[source] = {
      createdAt: previous?.createdAt ?? timestamp,
      updatedAt: timestamp,
      contentHash: hashes[source],
    };
  }
  return { version: 1, pages };
}

export function checkPageDates(hashes, registry) {
  validateRegistry(registry);
  return [
    ...Object.keys(hashes).filter(
      (source) => registry.pages[source]?.contentHash !== hashes[source],
    ),
    ...Object.keys(registry.pages).filter((source) => !(source in hashes)),
  ].sort();
}

function main() {
  const mode = process.argv[2];
  if (!["--check", "--update"].includes(mode) || process.argv.length !== 3) {
    throw new Error("Usage: node scripts/page-dates.mjs --check|--update");
  }
  const repositoryRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
  );
  const filename = path.join(repositoryRoot, "developer-guide/page-dates.json");
  const registry = fs.existsSync(filename)
    ? JSON.parse(fs.readFileSync(filename, "utf8"))
    : { version: 1, pages: {} };
  const hashes = collectPageHashes(repositoryRoot);
  const changed = checkPageDates(hashes, registry);

  if (mode === "--check") {
    if (changed.length) {
      throw new Error(
        `Page dates need updating:\n${changed.join("\n")}\nRun pnpm --filter developer-guide dates:update after finishing page edits.`,
      );
    }
    console.log(`Page dates verified for ${Object.keys(hashes).length} pages.`);
    return;
  }

  const next = updatePageDates(hashes, registry, new Date().toISOString());
  if (changed.length)
    fs.writeFileSync(filename, `${JSON.stringify(next, null, 2)}\n`);
  console.log(
    `Updated date metadata for ${changed.length} changed/new/removed pages; preserved creation dates and unchanged pages.`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
