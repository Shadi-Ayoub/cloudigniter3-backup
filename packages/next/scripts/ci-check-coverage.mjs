import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const report = JSON.parse(readFileSync(path.join(root, "coverage/coverage-summary.json"), "utf8"));
const policy = JSON.parse(readFileSync(path.join(root, "coverage-policy.json"), "utf8"));
const failures = [];
let measured = 0;
let legacy = 0;
for (const [absolute, metrics] of Object.entries(report)) {
  if (absolute === "total") continue;
  const file = path.relative(root, absolute).split(path.sep).join("/");
  if (!file.startsWith("src/")) throw new Error(`Unexpected coverage path: ${file}`);
  measured++;
  const hash = createHash("sha256").update(readFileSync(absolute)).digest("hex");
  const baseline = policy.legacy[file];
  const unchangedLegacy = baseline?.sha256 === hash;
  if (unchangedLegacy) legacy++;
  for (const [metric, minimum] of Object.entries(unchangedLegacy ? baseline.minimum : policy.minimum)) {
    if (!Number.isFinite(metrics[metric]?.pct) || metrics[metric].pct < minimum) {
      failures.push(`${file}: ${metric} ${metrics[metric]?.pct}% < ${minimum}%${unchangedLegacy ? " (legacy floor)" : " (new/changed file)"}`);
    }
  }
}
if (!measured) failures.push("No production files were measured.");
for (const file of Object.keys(policy.legacy)) {
  if (!report[path.join(root, file)]) failures.push(`Legacy file missing from coverage: ${file}. Review deletion or exclusions.`);
}
if (failures.length) throw new Error(`Coverage gate failed:\n${failures.join("\n")}`);
console.log(`Coverage gate passed: ${measured} production files; ${legacy} unchanged legacy exceptions. New/changed files require 90% lines/statements/functions and 80% branches.`);
