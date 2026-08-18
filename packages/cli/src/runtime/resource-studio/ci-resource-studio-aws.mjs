import { execa } from "execa";
import { randomBytes } from "node:crypto";

import {
  ciCreateResourceStudioLogStreamSanitizer,
  ciRedactResourceStudioLogString,
  ciValidateResourceStudioIdentifier,
} from "./ci-resource-studio-local-store.mjs";

const CI_SUPPORTED_NODE_LTS_MAJORS = new Set([22, 24]);
const CI_DEPLOYMENT_INTENT_TTL_MS = 10 * 60 * 1_000;
const CI_PLAN_HASH_PATTERN = /^[a-f0-9]{64}$/;

export function ciInspectResourceStudioNodeRuntime(
  version = process.versions.node,
) {
  const major = Number.parseInt(String(version).split(".")[0], 10);
  const supported = CI_SUPPORTED_NODE_LTS_MAJORS.has(major) && major % 2 === 0;
  return {
    version: String(version),
    major: Number.isInteger(major) ? major : null,
    supported,
    supportedMajors: [...CI_SUPPORTED_NODE_LTS_MAJORS],
  };
}

function ciAssertSupportedNodeRuntime(version) {
  const runtime = ciInspectResourceStudioNodeRuntime(version);
  if (runtime.supported) return runtime;
  const error = new Error(
    `Amplify deployment is disabled under Node.js ${runtime.version}. Run Resource Studio under a supported Node LTS (${runtime.supportedMajors.join(", ")}); offline Data Entity editing remains available.`,
  );
  error.code = "CI_RESOURCE_STUDIO_UNSUPPORTED_NODE_RUNTIME";
  error.statusCode = 409;
  throw error;
}

async function ciDefaultCommandRunner({
  command,
  args,
  cwd,
  env,
  interactive = false,
  onOutput,
}) {
  if (interactive) {
    const result = await execa(command, args, {
      cwd,
      env,
      preferLocal: true,
      reject: false,
      stdio: "inherit",
    });
    return { exitCode: result.exitCode, stdout: "", stderr: "" };
  }
  const subprocess = execa(command, args, {
    all: true,
    cwd,
    env,
    preferLocal: true,
    reject: false,
  });
  let outputWrite = Promise.resolve();
  subprocess.all?.on("data", (chunk) => {
    if (onOutput) {
      outputWrite = outputWrite.then(() => onOutput(String(chunk)));
    }
  });
  const result = await subprocess;
  await outputWrite;
  return {
    exitCode: result.exitCode,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    all: result.all ?? "",
  };
}

function ciCommandFailure(label, result) {
  const detail = ciRedactResourceStudioLogString(
    String(result.stderr || result.all || result.stdout || ""),
  )
    .trim()
    .split("\n")
    .slice(-12)
    .join("\n");
  const error = new Error(`${label} failed${detail ? `:\n${detail}` : "."}`);
  error.code = "CI_RESOURCE_STUDIO_AWS_COMMAND_FAILED";
  error.statusCode = 409;
  return error;
}

export function ciCreateResourceStudioAwsRuntime({
  applicationRoot,
  localStore,
  runCommand = ciDefaultCommandRunner,
  nodeVersion = process.versions.node,
  environment = process.env,
  now = Date.now,
  deploymentIntentTtlMs = CI_DEPLOYMENT_INTENT_TTL_MS,
}) {
  if (!Number.isFinite(deploymentIntentTtlMs) || deploymentIntentTtlMs <= 0) {
    throw new Error(
      "Deployment intent TTL must be a positive number of milliseconds.",
    );
  }
  const deploymentIntents = new Map();

  const saveSelection = async ({ profile, identifier }) => {
    const current = await localStore.readSettings();
    const selectedProfile = localStore.requireProfile(
      profile ?? current.profile,
    );
    const sandboxIdentifier = ciValidateResourceStudioIdentifier(
      identifier ?? current.sandboxIdentifier,
    );
    await localStore.updateSettings({
      profile: selectedProfile,
      sandboxIdentifier,
    });
    return { profile: selectedProfile, sandboxIdentifier };
  };

  const requirePlanHash = (planHash) => {
    if (typeof planHash !== "string" || !CI_PLAN_HASH_PATTERN.test(planHash)) {
      const error = new Error(
        "Resource Studio requires a current generated-plan hash before AWS preflight.",
      );
      error.code = "CI_RESOURCE_STUDIO_PLAN_HASH_REQUIRED";
      error.statusCode = 409;
      throw error;
    }
    return planHash;
  };

  const resolveRegion = async (profile) => {
    for (const name of ["AWS_REGION", "AWS_DEFAULT_REGION"]) {
      const value = environment?.[name];
      if (typeof value === "string" && value.trim() !== "") {
        return { region: value.trim(), source: name };
      }
    }
    const result = await runCommand({
      command: "aws",
      args: ["configure", "get", "region", "--profile", profile],
      cwd: applicationRoot,
    });
    const region = String(result.stdout ?? "").trim();
    if (result.exitCode !== 0 || !region) {
      await localStore.appendLog({
        type: "aws-preflight",
        status: "failed",
        message: `AWS profile ${profile} does not resolve a region.`,
      });
      const error = new Error(
        `AWS profile ${profile} does not define a region and neither AWS_REGION nor AWS_DEFAULT_REGION is set. Configure one before deploying.`,
      );
      error.code = "CI_RESOURCE_STUDIO_AWS_REGION_REQUIRED";
      error.statusCode = 409;
      throw error;
    }
    return { region, source: "profile" };
  };

  const readIdentity = async (selection) => {
    await localStore.appendLog({
      type: "aws-preflight",
      status: "started",
      message: `Checking AWS profile ${selection.profile}.`,
    });
    const result = await runCommand({
      command: "aws",
      args: [
        "sts",
        "get-caller-identity",
        "--profile",
        selection.profile,
        "--output",
        "json",
      ],
      cwd: applicationRoot,
    });
    if (result.exitCode !== 0) {
      await localStore.appendLog({
        type: "aws-preflight",
        status: "failed",
        message: `AWS profile ${selection.profile} needs attention.`,
      });
      throw ciCommandFailure("AWS STS preflight", result);
    }
    const resolvedRegion = await resolveRegion(selection.profile);
    let identity;
    try {
      identity = JSON.parse(result.stdout);
    } catch (error) {
      const invalid = new Error("AWS STS returned invalid JSON.", {
        cause: error,
      });
      invalid.code = "CI_RESOURCE_STUDIO_INVALID_STS_RESPONSE";
      invalid.statusCode = 502;
      throw invalid;
    }
    const output = {
      profile: selection.profile,
      account: String(identity.Account ?? ""),
      arn: String(identity.Arn ?? ""),
      userId: String(identity.UserId ?? ""),
      region: resolvedRegion.region,
      regionSource: resolvedRegion.source,
    };
    if (!output.account || !output.arn || !output.userId) {
      const error = new Error(
        "AWS STS returned an incomplete caller identity.",
      );
      error.code = "CI_RESOURCE_STUDIO_INVALID_STS_RESPONSE";
      error.statusCode = 502;
      throw error;
    }
    await localStore.appendLog({
      type: "aws-preflight",
      status: "completed",
      message: `AWS profile ${selection.profile} is ready.`,
      account: output.account,
      arn: output.arn,
      region: output.region,
    });
    return output;
  };

  const issueDeploymentIntent = ({ selection, identity, planHash }) => {
    const currentTime = now();
    for (const [id, intent] of deploymentIntents) {
      if (intent.expiresAtMs <= currentTime) deploymentIntents.delete(id);
    }
    while (deploymentIntents.size >= 32) {
      deploymentIntents.delete(deploymentIntents.keys().next().value);
    }
    const intentId = randomBytes(24).toString("base64url");
    const intent = {
      intentId,
      profile: selection.profile,
      identifier: selection.sandboxIdentifier,
      account: identity.account,
      arn: identity.arn,
      userId: identity.userId,
      region: identity.region,
      planHash: requirePlanHash(planHash),
      expiresAtMs: currentTime + deploymentIntentTtlMs,
    };
    deploymentIntents.set(intentId, intent);
    return {
      intentId,
      expiresAt: new Date(intent.expiresAtMs).toISOString(),
    };
  };

  const preflight = async ({ profile, identifier, planHash }) => {
    requirePlanHash(planHash);
    const selection = await saveSelection({ profile, identifier });
    const identity = await readIdentity(selection);
    return {
      ...identity,
      identifier: selection.sandboxIdentifier,
      ...issueDeploymentIntent({ selection, identity, planHash }),
    };
  };

  const takeDeploymentIntent = (intentId) => {
    const intent =
      typeof intentId === "string"
        ? deploymentIntents.get(intentId)
        : undefined;
    if (intentId) deploymentIntents.delete(intentId);
    if (!intent || intent.expiresAtMs <= now()) {
      const error = new Error(
        "The verified deployment intent is missing or expired. Run AWS access preflight again.",
      );
      error.code = "CI_RESOURCE_STUDIO_DEPLOYMENT_INTENT_EXPIRED";
      error.statusCode = 409;
      throw error;
    }
    return intent;
  };

  const assertIntentBinding = ({ intent, selection, planHash }) => {
    if (
      intent.profile !== selection.profile ||
      intent.identifier !== selection.sandboxIdentifier ||
      intent.planHash !== requirePlanHash(planHash)
    ) {
      const error = new Error(
        "The profile, sandbox identifier, or generated plan changed after preflight. Verify AWS access again.",
      );
      error.code = "CI_RESOURCE_STUDIO_DEPLOYMENT_INTENT_MISMATCH";
      error.statusCode = 409;
      throw error;
    }
  };

  const assertIdentityBinding = (intent, identity) => {
    if (
      intent.account !== identity.account ||
      intent.arn !== identity.arn ||
      intent.userId !== identity.userId ||
      intent.region !== identity.region
    ) {
      const error = new Error(
        "AWS identity or region changed after preflight. No sandbox command was run; verify AWS access again.",
      );
      error.code = "CI_RESOURCE_STUDIO_AWS_IDENTITY_DRIFT";
      error.statusCode = 409;
      throw error;
    }
  };

  return {
    async getSettings() {
      return {
        ...(await localStore.readSettings()),
        nodeRuntime: ciInspectResourceStudioNodeRuntime(nodeVersion),
      };
    },

    async preflight(input) {
      return preflight(input ?? {});
    },

    async ssoLogin(input) {
      requirePlanHash(input?.planHash);
      const selection = await saveSelection(input ?? {});
      await localStore.appendLog({
        type: "aws-sso-login",
        status: "started",
        message: `Starting AWS SSO login for ${selection.profile}.`,
      });
      const result = await runCommand({
        command: "aws",
        args: ["sso", "login", "--profile", selection.profile],
        cwd: applicationRoot,
        interactive: true,
      });
      if (result.exitCode !== 0) {
        await localStore.appendLog({
          type: "aws-sso-login",
          status: "failed",
          message: `AWS SSO login failed for ${selection.profile}.`,
        });
        throw ciCommandFailure("AWS SSO login", result);
      }
      await localStore.appendLog({
        type: "aws-sso-login",
        status: "completed",
        message: `AWS SSO login completed for ${selection.profile}.`,
      });
      const identity = await readIdentity(selection);
      return {
        status: "completed",
        ...identity,
        identifier: selection.sandboxIdentifier,
        ...issueDeploymentIntent({
          selection,
          identity,
          planHash: input?.planHash,
        }),
      };
    },

    async deploy(input) {
      ciAssertSupportedNodeRuntime(nodeVersion);
      const selection = await saveSelection(input ?? {});
      const intent = takeDeploymentIntent(input?.intentId);
      assertIntentBinding({ intent, selection, planHash: input?.planHash });
      const identity = await readIdentity(selection);
      assertIdentityBinding(intent, identity);
      await localStore.appendLog({
        type: "sandbox-deploy",
        status: "started",
        message: `Starting one-shot Amplify sandbox ${selection.sandboxIdentifier}.`,
        profile: selection.profile,
        identifier: selection.sandboxIdentifier,
      });
      const args = [
        "sandbox",
        "--once",
        "--profile",
        selection.profile,
        "--identifier",
        selection.sandboxIdentifier,
      ];
      let streamedOutput = false;
      const outputSanitizer = ciCreateResourceStudioLogStreamSanitizer();
      const persistOutputLine = async (line) => {
        if (!line) return;
        await localStore.appendLog({
          type: "sandbox-output",
          status: "output",
          message: line,
        });
      };
      const result = await runCommand({
        command: "ampx",
        args,
        cwd: applicationRoot,
        env: {
          AWS_REGION: identity.region,
          AWS_DEFAULT_REGION: identity.region,
        },
        onOutput: async (chunk) => {
          streamedOutput = true;
          for (const line of outputSanitizer.push(chunk)) {
            await persistOutputLine(line);
          }
        },
      });
      if (streamedOutput) {
        for (const line of outputSanitizer.flush()) {
          await persistOutputLine(line);
        }
      } else {
        const outputLines = [
          ...outputSanitizer.push(
            String(result.all || result.stdout || result.stderr || ""),
          ),
          ...outputSanitizer.flush(),
        ].slice(-500);
        for (const line of outputLines) {
          await persistOutputLine(line);
        }
      }
      if (result.exitCode !== 0) {
        await localStore.appendLog({
          type: "sandbox-deploy",
          status: "failed",
          message: `Amplify sandbox ${selection.sandboxIdentifier} failed; generated source files were retained for a compensating deploy.`,
        });
        throw ciCommandFailure("Amplify sandbox deployment", result);
      }
      await localStore.appendLog({
        type: "sandbox-deploy",
        status: "completed",
        message: `Amplify sandbox ${selection.sandboxIdentifier} completed.`,
        profile: selection.profile,
        identifier: selection.sandboxIdentifier,
      });
      return {
        status: "completed",
        profile: selection.profile,
        identifier: selection.sandboxIdentifier,
        identity,
        command: { executable: "ampx", arguments: args },
      };
    },
  };
}
