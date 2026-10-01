import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { ciPublicHelp } from "../../packages/cli/src/cli/help.mjs";
import { ciPackageCommands } from "../../packages/dev/src/package-workflows.mjs";
import { ciGithubCommands } from "../../packages/dev/src/github-workflow.mjs";

const root = new URL("../commands/", import.meta.url);
const maintainer = await readFile(
  new URL("../../packages/dev/src/maintainer-cli.mjs", import.meta.url),
  "utf8",
);
const publicCommands = [
  ...ciPublicHelp
    .split("  Commands\n")[1]
    .split("  Global options")[0]
    .matchAll(/^    (\S.*?)\s{2,}/gm),
].map((match) => `ci ${match[1]}`);
const maintenance = [
  ...maintainer.matchAll(/^  "((?:package|quality|next|modules) [^"]+)": \{/gm),
].map((match) => `dev ${match[1]}`);
const expected = new Set([
  "dev publisher",
  ...publicCommands,
  ...maintenance,
  ...Object.keys(ciPackageCommands).map((action) => `dev package ${action}`),
  ...Object.keys(ciGithubCommands).map((action) => `dev github ${action}`),
  ...[
    "plan",
    "publish",
    "status",
    "version",
    "candidate",
    "stage",
    "deliver",
  ].map((action) => `dev npm ${action}`),
  ...["export", "check", "publish", "status", "deliver"].map(
    (action) => `dev template ${action}`,
  ),
  ...["setup", "check", "profiles", "repositories", "scaffold", "clone", "pull"].map(
    (action) => `dev github ${action}`,
  ),
]);
const documented = new Set();
for (const family of ["ci", "dev"]) {
  const index = await readFile(new URL(`${family}/index.mdx`, root), "utf8");
  for (const file of await readdir(new URL(`${family}/`, root))) {
    if (!file.endsWith(".mdx") || file === "index.mdx") continue;
    const text = await readFile(new URL(`${family}/${file}`, root), "utf8");
    const name = JSON.parse(text.match(/^title: (.+)$/m)[1]);
    documented.add(name);
    for (const heading of [
      "Syntax",
      "Prerequisites",
      "Parameters",
      "Remarks and effects",
      "Examples",
      "Errors and recovery",
    ])
      assert.ok(text.includes(`## ${heading}`), `${name}: missing ${heading}`);
    assert.ok(index.includes(`](./${file})`), `${name}: missing index link`);
  }
}
assert.deepEqual(
  [...documented].sort(),
  [...expected].sort(),
  "Command manuals must match the executable catalog.",
);
console.log(
  `Command reference covers all ${expected.size} commands with complete manuals and index links.`,
);
