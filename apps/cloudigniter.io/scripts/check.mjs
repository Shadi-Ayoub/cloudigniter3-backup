import assert from "node:assert/strict";
import { lstat, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import vm from "node:vm";

export const siteRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

/** Dependency-free source checks; browser rendering is verified separately. */
export async function checkSite() {
  const source = path.join(siteRoot, "index.html");
  const stat = await lstat(source);
  assert.ok(
    stat.isFile() && !stat.isSymbolicLink(),
    "index.html must be a regular file",
  );
  const html = await readFile(source, "utf8");
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<html\b[^>]*lang="en"/);
  assert.match(html, /name="viewport"/);
  assert.match(
    html,
    /<title>CloudIgniter — A foundation for what comes next\.<\/title>/,
  );
  assert.match(html, /rel="canonical" href="https:\/\/cloudigniter\.io\/"/);
  assert.doesNotMatch(html, /<script\b[^>]*\bsrc\s*=/i);
  assert.doesNotMatch(html, /<link\b[^>]*rel=["']stylesheet["']/i);
  assert.doesNotMatch(html, /@import\s|url\(["']?https?:/i);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, "HTML IDs must be unique");
  const fragments = [...html.matchAll(/\bhref="#([^"]+)"/g)].map((m) => m[1]);
  assert.ok(
    fragments.every((id) => ids.includes(id)),
    "Fragment links and SVG references must exist",
  );
  const aria = [
    ...html.matchAll(/\baria-(?:controls|labelledby|describedby)="([^"]+)"/g),
  ].flatMap((m) => m[1].split(/\s+/));
  assert.ok(
    aria.every((id) => ids.includes(id)),
    "ARIA references must exist",
  );
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.equal(
    scripts.length,
    2,
    "Theme bootstrap and page behavior must remain inline",
  );
  for (const [index, script] of scripts.entries())
    new vm.Script(script[1], { filename: `index.html:inline-${index + 1}` });
  assert.equal([...html.matchAll(/\bdata-capability="[^"]+"/g)].length, 6);
  assert.match(html, /prefers-reduced-motion/);
  assert.match(html, /:focus-visible/);
  const metadata = JSON.parse(
    await readFile(path.join(siteRoot, "publisher.config.json"), "utf8"),
  );
  assert.equal(metadata.project, "cloudigniter-website");
  assert.equal(metadata.workspaceName, "cloudigniter");
  assert.equal(metadata.staticHosting, true);
  console.log(
    "CloudIgniter website: source structure, references, inline JavaScript and Publisher registration passed.",
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await checkSite();
