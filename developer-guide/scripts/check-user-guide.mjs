import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsRoot = path.join(site, "docs");
const structure = JSON.parse(
  fs.readFileSync(path.join(site, "user-guide-structure.json"), "utf8")
);
const documents = new Map();
function collect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name.startsWith("_")) continue;
    const filename = path.join(directory, entry.name);
    if (filename === path.join(docsRoot, "api-reference")) continue;
    if (entry.isDirectory()) collect(filename);
    else if (/\.mdx?$/.test(entry.name)) {
      const id = path
        .relative(docsRoot, filename)
        .replace(/\\/g, "/")
        .replace(/\.mdx?$/, "");
      documents.set(id, fs.readFileSync(filename, "utf8"));
    }
  }
}
collect(docsRoot);

const current = structure.chapters.flatMap((chapter) => [
  chapter.overview,
  ...chapter.items,
]);
const archived = structure.obsolete.flatMap((group) => group.items);
const assigned = [...current, "obsolete/index", ...archived];
const errors = [];
for (const id of new Set(assigned)) {
  if (!documents.has(id)) errors.push(`Missing Users document: ${id}`);
  if (assigned.filter((candidate) => candidate === id).length !== 1)
    errors.push(`Document assigned more than once: ${id}`);
}
for (const id of documents.keys()) {
  if (!assigned.includes(id))
    errors.push(`Document missing from Users navigation: ${id}`);
}
for (const group of structure.obsolete) {
  if (!current.includes(group.replacement))
    errors.push(
      `Archive replacement is not a current lesson: ${group.replacement}`
    );
  if (!group.reason?.trim())
    errors.push(`Archive group needs a reason: ${group.label}`);
  for (const id of group.items) {
    const text = documents.get(id) ?? "";
    if (
      !text.includes(":::warning Obsulete") ||
      !text.includes(`](/docs/${group.replacement})`)
    )
      errors.push(
        `Archive page needs its historical notice and current replacement: ${id}`
      );
  }
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Users navigation verified: ${current.length} current pages, ${archived.length} historical pages, one archive overview, no missing or duplicate assignments.`
  );
}
