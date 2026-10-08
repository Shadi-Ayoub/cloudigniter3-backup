import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const coreRequire = createRequire(require.resolve("@docusaurus/core/package.json"));
const { DEFAULT_PARSE_FRONT_MATTER } = coreRequire("@docusaurus/utils");
const structure = JSON.parse(fs.readFileSync(path.join(site, "user-guide-structure.json"), "utf8"));

function collect(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith(".") || entry.name.startsWith("_")) return [];
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? collect(filename) : /\.mdx?$/.test(filename) ? [filename] : [];
  });
}
function currentDocuments(item) {
  return typeof item === "string" ? [item] : [item.overview, ...item.items.flatMap(currentDocuments)];
}
const current = new Set(structure.chapters.flatMap(currentDocuments));
const routes = new Map();
const lessons = [];
for (const section of ["docs", "company-developers", "dictionary", "developer-dictionary", "commands"]) {
  for (const filename of collect(path.join(site, section))) {
    const id = path.relative(path.join(site, section), filename).replace(/\\/g, "/").replace(/\.mdx?$/, "");
    const { frontMatter } = await DEFAULT_PARSE_FRONT_MATTER({ filePath: filename, fileContent: fs.readFileSync(filename, "utf8") });
    // Docusaurus treats index.md and a file named after its folder as category indexes.
    const segments = id.split("/");
    const isIndex = segments.at(-1) === "index" || segments.length > 1 && segments.at(-1) === segments.at(-2);
    const slug = frontMatter.slug ?? (isIndex ? segments.slice(0, -1).join("/") : id);
    const route = `/${section}/${String(slug).replace(/^\//, "")}`.replace(/\/$/, "");
    routes.set(route, filename);
    if (section === "company-developers" || section === "docs" && current.has(id)) lessons.push({ filename, frontMatter, route });
  }
}

const errors = [];
const questions = new Map();
let count = 0;
for (const { filename, frontMatter, route } of lessons) {
  const source = path.relative(site, filename);
  const learning = frontMatter.learning;
  if (learning === false) continue;
  if (!learning || !Array.isArray(learning.prerequisites) || !learning.prerequisites.length || !Array.isArray(learning.questions) || !learning.questions.length) {
    errors.push(`${source}: provide linked prerequisites and distinct review questions, or explicitly mark an index with learning: false.`);
    continue;
  }
  count++;
  const hrefs = new Set();
  for (const prerequisite of learning.prerequisites) {
    if (!prerequisite.topic?.trim() || typeof prerequisite.href !== "string") {
      errors.push(`${source}: every prerequisite needs a topic and a reading link.`); continue;
    }
    const href = prerequisite.href;
    if (hrefs.has(href)) errors.push(`${source}: duplicate prerequisite ${href}.`);
    hrefs.add(href);
    if (href.startsWith("/")) {
      const [target] = href.split("#");
      if (!routes.has(target.replace(/\/$/, ""))) errors.push(`${source}: unknown prerequisite ${href}.`);
      if (target === route) errors.push(`${source}: a prerequisite must not link to the lesson itself.`);
    } else if (!/^https:\/\//.test(href)) errors.push(`${source}: use a guide URL or HTTPS source for ${href}.`);
  }
  for (const item of learning.questions) {
    const { question, answer } = item ?? {};
    if (typeof question !== "string" || !question.trim().endsWith("?")) {
      errors.push(`${source}: every review item needs a nonempty question.`); continue;
    }
    if (typeof answer !== "string" || !answer.trim()) errors.push(`${source}: review question needs a key answer: ${question}`);
    const key = question.toLocaleLowerCase().replace(/\s+/g, " ").trim();
    if (questions.has(key)) errors.push(`${source}: question is already used in ${questions.get(key)}: ${question}`);
    else questions.set(key, source);
  }
}
if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
else console.log(`Learning content verified: ${count} lessons, ${questions.size} distinct questions with key answers, ${lessons.length - count} explicit index/summary exclusions.`);
