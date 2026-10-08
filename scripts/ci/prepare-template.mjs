import { copyFile, lstat } from "node:fs/promises";
import { constants } from "node:fs";
import { fileURLToPath } from "node:url";

const target = fileURLToPath(new URL("../../apps/templates/cloudigniter-next-aws-v1/amplify_outputs.json", import.meta.url));
const fixture = fileURLToPath(new URL("../../apps/templates/cloudigniter-next-aws-v1/__tests__/fixtures/amplify-outputs.json", import.meta.url));
try {
  const existing = await lstat(target);
  if (!existing.isFile() || existing.isSymbolicLink()) throw new Error("Refusing a non-regular Amplify outputs path.");
  console.log("Preserved existing local Amplify outputs; no deployment configuration changed.");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  await copyFile(fixture, target, constants.COPYFILE_EXCL);
  console.log("Prepared offline CI Amplify outputs. These placeholders cannot reach a deployed backend.");
}
