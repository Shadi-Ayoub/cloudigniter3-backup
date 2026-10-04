import path from "node:path";
import { readFile, writeFile, appendFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";
import {
  ciMirrorConfiguration,
  ciMirrorAuthorization,
  ciMirrorApi,
  ciMirrorSnapshot,
} from "../source-mirror.mjs";
import { ciMirrorGit, ciMirrorSources } from "../source-mirror-git.mjs";

const env = process.env,
  root = process.cwd();
const directory = env.RUNNER_TEMP;
if (
  !directory ||
  env.GITHUB_ACTIONS !== "true" ||
  !["push", "workflow_dispatch"].includes(env.GITHUB_EVENT_NAME ?? "")
)
  throw new Error(
    "Source mirroring is a post-merge company Actions operation.",
  );
const planFile = path.join(directory, "cloudigniter-source-mirror-plan.json");
const resultFile = path.join(
  directory,
  "cloudigniter-source-mirror-result.json",
);

/** @param {unknown} value */
async function report(value) {
  await writeFile(resultFile, JSON.stringify(value, null, 2) + "\n");
  if (env.GITHUB_STEP_SUMMARY) {
    await appendFile(
      env.GITHUB_STEP_SUMMARY,
      "### CloudIgniter source mirroring\n\n```json\n" +
        JSON.stringify(value, null, 2) +
        "\n```\n",
    );
  }
}

try {
  const sha = (await ciMirrorGit(["rev-parse", "HEAD"], root)).trim();
  const { policy, inventory } = await ciMirrorConfiguration(root, sha);
  if (
    env.GITHUB_REPOSITORY !== policy.workspaceRepository ||
    env.GITHUB_REF !== `refs/heads/${policy.baseBranch}`
  )
    throw new Error(
      "Source mirroring requires the canonical company main branch.",
    );
  const readApi = ciMirrorApi(env.GITHUB_TOKEN ?? "");
  if (process.argv[2] === "verify" && process.argv.length === 3) {
    const deadline = Date.now() + 25 * 60 * 1000;
    let proof;
    do {
      proof = await ciMirrorAuthorization(policy, sha, readApi);
      if (proof.status !== "waiting") break;
      if (Date.now() >= deadline)
        throw new Error(
          "Timed out waiting for merged-commit quality checks. Fix or finish CI, then run Source mirroring on main again.",
        );
      console.log(
        "Waiting for the configured merged-commit quality workflows...",
      );
      await sleep(20000);
    } while (true);
    const targets = [];
    if (proof.status === "authorized") {
      for (const [project, item] of Object.entries(inventory.projects)) {
        if (!item.sourcePath || !item.sourceRepository) continue;
        const files = await ciMirrorSnapshot(root, sha, item.sourcePath);
        if (!Object.keys(files).length)
          throw new Error(
            `Mapped source root is absent: ${project}. Correct the reviewed repository inventory.`,
          );
        targets.push({
          project,
          repository: item.sourceRepository,
          sourcePath: item.sourcePath,
        });
      }
    }
    const plan = { schemaVersion: 1, workspaceCommit: sha, proof, targets };
    await writeFile(planFile, JSON.stringify(plan, null, 2) + "\n");
    if (env.GITHUB_OUTPUT)
      await appendFile(
        env.GITHUB_OUTPUT,
        `should_mirror=${proof.status === "authorized" && targets.length > 0}\nrepositories=${targets.map((item) => item.repository.split("/")[1]).join(",")}\n`,
      );
    await report({
      phase: "verification",
      status: proof.status,
      workspaceCommit: sha,
      targets,
    });
  } else if (process.argv[2] === "mirror" && process.argv.length === 3) {
    const plan = JSON.parse(await readFile(planFile, "utf8"));
    if (
      plan.schemaVersion !== 1 ||
      plan.workspaceCommit !== sha ||
      plan.proof?.status !== "authorized"
    )
      throw new Error(
        "The verified mirror plan differs from this committed checkout.",
      );
    const token = env.CLOUDIGNITER_MIRROR_TOKEN ?? "";
    const result = await ciMirrorSources(root, sha, {
      readApi,
      destinationApi: ciMirrorApi(token),
      token,
    });
    await report(result);
    if (result.failed) process.exitCode = 1;
  } else
    throw new Error(
      "Select verify or mirror; arbitrary source commits and repositories are unsupported.",
    );
} catch (error) {
  const message =
    error instanceof Error ? error.message : "Source mirroring failed.";
  await report({ status: "failed", error: message });
  console.error(message);
  process.exitCode = 1;
}
