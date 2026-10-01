import { CiDevUsageError } from "./runtime.mjs";
/** Preserve package order and gates; modify only the obfuscation step.
 * @param {{file:string,message:string}[]} steps @param {string} option
 */
export function ciBuildStepsWithObfuscation(steps, option = "configured") {
  if (!["configured", "on", "off"].includes(option))
    throw new CiDevUsageError("Expected obfuscation configured, on or off.");
  if (option === "configured") return steps;
  const result = steps.filter(
    (step) => step.file !== "ci-obfuscate-package.mjs",
  );
  if (option === "on") {
    const index = result.findIndex(
      (step) => step.file === "ci-switch-dist.mjs",
    );
    result.splice(index < 0 ? result.length : index, 0, {
      file: "ci-obfuscate-package.mjs",
      message: "Obfuscating build output",
    });
  }
  return result;
}
