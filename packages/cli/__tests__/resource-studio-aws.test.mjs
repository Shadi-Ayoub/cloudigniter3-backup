import assert from "node:assert/strict";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { ciCreateResourceStudioAwsRuntime } from "../src/runtime/resource-studio/ci-resource-studio-aws.mjs";
import {
  ciCreateResourceStudioLocalStore,
  ciCreateResourceStudioLogStreamSanitizer,
} from "../src/runtime/resource-studio/ci-resource-studio-local-store.mjs";

const CI_TEST_PLAN_HASH = "a".repeat(64);

async function ciCreateApplication(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "ci-resource-studio-aws-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

test("persists only gitignored non-secret settings and uses a stable identifier", async (t) => {
  const applicationRoot = await ciCreateApplication(t);
  await mkdir(path.join(applicationRoot, ".cloudigniter/local"), {
    recursive: true,
  });
  await writeFile(
    path.join(applicationRoot, ".cloudigniter/local/.gitignore"),
    "# machine-local files\nlogs/\n",
  );
  const first = await ciCreateResourceStudioLocalStore({ applicationRoot });
  const firstSettings = await first.readSettings();
  assert.match(firstSettings.sandboxIdentifier, /^ci-rs-[a-f0-9]{8}$/);
  await first.updateSettings({
    profile: "developer-sso",
    sandboxIdentifier: firstSettings.sandboxIdentifier,
  });
  await first.appendLog({
    type: "test",
    status: "completed",
    accessToken: "must-not-be-persisted",
    awsAppsyncApiKey: "structured-api-value",
    privateKey: "structured-private-value",
    message:
      '\u001b[31mBearer bearer-value\u001b[0m Authorization: Basic basic-value Authorization=raw-auth api_key=api-value aws_appsync_api_key=snake-api-value awsAppsyncApiKey=camel-api-value "aws_appsync_api_key": "json-api-value" AWS_SECRET_ACCESS_KEY=aws-secret AWS_SESSION_TOKEN=session-value token=bare-token client_secret=client-value private_key=private-value AKIA1234567890ABCDEF eyJabc.def.ghi\n-----BEGIN PRIVATE KEY-----\npem-body-value\n-----END PRIVATE KEY-----',
  });

  const second = await ciCreateResourceStudioLocalStore({ applicationRoot });
  assert.deepEqual(await second.readSettings(), {
    schemaVersion: 1,
    profile: "developer-sso",
    sandboxIdentifier: firstSettings.sandboxIdentifier,
  });
  const settingsPath = path.join(
    applicationRoot,
    ".cloudigniter/local/resource-studio/settings.json",
  );
  assert.equal((await stat(settingsPath)).mode & 0o777, 0o600);
  assert.equal(
    await readFile(
      path.join(applicationRoot, ".cloudigniter/local/.gitignore"),
      "utf8",
    ),
    "# machine-local files\nlogs/\n*\n",
  );
  const lifecycle = await readFile(
    path.join(
      applicationRoot,
      ".cloudigniter/local/resource-studio/lifecycle.jsonl",
    ),
    "utf8",
  );
  assert.doesNotMatch(
    lifecycle,
    /must-not-be-persisted|accessToken|structured-api-value|structured-private-value|bearer-value|basic-value|raw-auth|api-value|snake-api-value|camel-api-value|json-api-value|aws-secret|session-value|bare-token|client-value|private-value|AKIA1234567890ABCDEF|eyJabc\.def\.ghi|pem-body-value|BEGIN PRIVATE KEY|END PRIVATE KEY|\u001b/,
  );
  assert.match(lifecycle, /REDACTED/);
});

test("redacts prefixed identifiers and statefully suppresses streamed PEM blocks", () => {
  const sanitizer = ciCreateResourceStudioLogStreamSanitizer();
  const output = [];
  for (const chunk of [
    "aws_appsync_api_",
    'key=snake-stream-secret\n"awsAppsyncApiKey": "camel-stream-secret"\n',
    "before -----BEGIN ENCRYPTED PRI",
    "VATE KEY-----\n",
    "pem-stream-body-secret\n",
    "-----END ENCRYPTED PRIVATE",
    " KEY----- after token=tail-stream-secret\nsandbox complete",
  ]) {
    output.push(...sanitizer.push(chunk));
  }
  output.push(...sanitizer.flush());

  assert.deepEqual(output, [
    "aws_appsync_api_key=[REDACTED]",
    '"awsAppsyncApiKey": [REDACTED]',
    "before [REDACTED_PEM_BLOCK]",
    " after token=[REDACTED]",
    "sandbox complete",
  ]);
  assert.doesNotMatch(
    JSON.stringify(output),
    /snake-stream-secret|camel-stream-secret|pem-stream-body-secret|tail-stream-secret|BEGIN ENCRYPTED PRIVATE KEY|END ENCRYPTED PRIVATE KEY/,
  );
});

test("runs explicit STS, region, SSO, and one-shot sandbox commands", async (t) => {
  const applicationRoot = await ciCreateApplication(t);
  const localStore = await ciCreateResourceStudioLocalStore({
    applicationRoot,
  });
  const calls = [];
  const runCommand = async (input) => {
    calls.push({
      ...structuredClone({ ...input, onOutput: undefined }),
      hasOutputHandler: typeof input.onOutput === "function",
    });
    if (input.args[0] === "sts") {
      return {
        exitCode: 0,
        stdout: JSON.stringify({
          Account: "123456789012",
          Arn: "arn:aws:sts::123456789012:assumed-role/Developer/person",
          UserId: "user-id",
        }),
        stderr: "",
      };
    }
    if (input.args[0] === "configure") {
      return { exitCode: 0, stdout: "eu-west-1\n", stderr: "" };
    }
    await input.onOutput?.("AWS_SECRET_ACCESS_");
    await input.onOutput?.("KEY=streamed-secret\n-----BEGIN PRIVATE ");
    await input.onOutput?.(
      "KEY-----\npem-runtime-body-secret\n-----END PRIVATE",
    );
    await input.onOutput?.(
      " KEY-----\nawsAppsyncApiKey=runtime-api-secret\nsandbox complete\n",
    );
    return { exitCode: 0, stdout: "sandbox complete\n", stderr: "" };
  };
  const runtime = ciCreateResourceStudioAwsRuntime({
    applicationRoot,
    localStore,
    runCommand,
    nodeVersion: "22.15.0",
    environment: {},
  });

  const identity = await runtime.preflight({
    profile: "developer-sso",
    identifier: "ci-books",
    planHash: CI_TEST_PLAN_HASH,
  });
  assert.equal(identity.profile, "developer-sso");
  assert.equal(identity.account, "123456789012");
  assert.equal(
    identity.arn,
    "arn:aws:sts::123456789012:assumed-role/Developer/person",
  );
  assert.equal(identity.userId, "user-id");
  assert.equal(identity.region, "eu-west-1");
  assert.equal(identity.regionSource, "profile");
  assert.equal(identity.identifier, "ci-books");
  assert.match(identity.intentId, /^[A-Za-z0-9_-]+$/);
  assert.match(identity.expiresAt, /^\d{4}-\d{2}-\d{2}T/);
  const afterLogin = await runtime.ssoLogin({
    profile: "developer-sso",
    identifier: "ci-books",
    planHash: CI_TEST_PLAN_HASH,
  });
  assert.equal(afterLogin.account, identity.account);
  assert.equal(afterLogin.region, identity.region);
  assert.notEqual(afterLogin.intentId, identity.intentId);
  const deployed = await runtime.deploy({
    profile: "developer-sso",
    identifier: "ci-books",
    planHash: CI_TEST_PLAN_HASH,
    intentId: afterLogin.intentId,
  });
  assert.equal(deployed.identifier, "ci-books");
  assert.equal(deployed.identity.region, "eu-west-1");

  assert.deepEqual(
    calls.map(({ command, args, interactive }) => ({
      command,
      args,
      interactive,
    })),
    [
      {
        command: "aws",
        args: [
          "sts",
          "get-caller-identity",
          "--profile",
          "developer-sso",
          "--output",
          "json",
        ],
        interactive: undefined,
      },
      {
        command: "aws",
        args: ["configure", "get", "region", "--profile", "developer-sso"],
        interactive: undefined,
      },
      {
        command: "aws",
        args: ["sso", "login", "--profile", "developer-sso"],
        interactive: true,
      },
      {
        command: "aws",
        args: [
          "sts",
          "get-caller-identity",
          "--profile",
          "developer-sso",
          "--output",
          "json",
        ],
        interactive: undefined,
      },
      {
        command: "aws",
        args: ["configure", "get", "region", "--profile", "developer-sso"],
        interactive: undefined,
      },
      {
        command: "aws",
        args: [
          "sts",
          "get-caller-identity",
          "--profile",
          "developer-sso",
          "--output",
          "json",
        ],
        interactive: undefined,
      },
      {
        command: "aws",
        args: ["configure", "get", "region", "--profile", "developer-sso"],
        interactive: undefined,
      },
      {
        command: "ampx",
        args: [
          "sandbox",
          "--once",
          "--profile",
          "developer-sso",
          "--identifier",
          "ci-books",
        ],
        interactive: undefined,
      },
    ],
  );
  const ampxCall = calls.at(-1);
  assert.deepEqual(ampxCall.env, {
    AWS_REGION: "eu-west-1",
    AWS_DEFAULT_REGION: "eu-west-1",
  });
  const logs = await localStore.readLogs();
  assert.doesNotMatch(
    JSON.stringify(logs),
    /streamed-secret|pem-runtime-body-secret|runtime-api-secret|BEGIN PRIVATE KEY|END PRIVATE KEY/,
  );
  assert.match(JSON.stringify(logs), /AWS_SECRET_ACCESS_KEY=\[REDACTED\]/);
  assert.match(JSON.stringify(logs), /\[REDACTED_PEM_BLOCK\]/);
  assert.match(JSON.stringify(logs), /awsAppsyncApiKey=\[REDACTED\]/);
});

test("requires a profile and retains generated source when a deploy fails", async (t) => {
  const applicationRoot = await ciCreateApplication(t);
  const localStore = await ciCreateResourceStudioLocalStore({
    applicationRoot,
  });
  const generatedPath = path.join(
    applicationRoot,
    "amplify/custom/data/schema.ts",
  );
  await mkdir(path.dirname(generatedPath), { recursive: true });
  await writeFile(generatedPath, "generated source\n");

  const missingProfileRuntime = ciCreateResourceStudioAwsRuntime({
    applicationRoot,
    localStore,
    runCommand: async () => {
      throw new Error("should not run");
    },
  });
  await assert.rejects(
    missingProfileRuntime.preflight({ planHash: CI_TEST_PLAN_HASH }),
    /explicit AWS profile/,
  );

  const runtime = ciCreateResourceStudioAwsRuntime({
    applicationRoot,
    localStore,
    nodeVersion: "24.2.0",
    environment: {},
    runCommand: async ({ command, args }) => {
      if (args[0] === "sts") {
        return {
          exitCode: 0,
          stdout: JSON.stringify({ Account: "1", Arn: "arn", UserId: "user" }),
          stderr: "",
        };
      }
      if (args[0] === "configure") {
        return { exitCode: 0, stdout: "us-east-1\n", stderr: "" };
      }
      assert.equal(command, "ampx");
      return {
        exitCode: 1,
        stdout: "",
        stderr:
          "deployment failed\n-----BEGIN PRIVATE KEY-----\nfailure-pem-body-secret\n-----END PRIVATE KEY-----\naws_appsync_api_key=failure-api-secret",
      };
    },
  });
  const verified = await runtime.preflight({
    profile: "developer-sso",
    identifier: "ci-books",
    planHash: CI_TEST_PLAN_HASH,
  });
  let deploymentError;
  await assert.rejects(
    runtime.deploy({
      profile: "developer-sso",
      identifier: "ci-books",
      planHash: CI_TEST_PLAN_HASH,
      intentId: verified.intentId,
    }),
    (error) => {
      deploymentError = error;
      return /Amplify sandbox deployment failed/.test(error.message);
    },
  );
  assert.doesNotMatch(
    deploymentError.message,
    /failure-pem-body-secret|failure-api-secret|BEGIN PRIVATE KEY|END PRIVATE KEY/,
  );
  assert.equal(await readFile(generatedPath, "utf8"), "generated source\n");
  const logs = await localStore.readLogs();
  assert.doesNotMatch(
    JSON.stringify(logs),
    /failure-pem-body-secret|failure-api-secret|BEGIN PRIVATE KEY|END PRIVATE KEY/,
  );
  assert.match(logs.at(-1).message, /retained for a compensating deploy/);
});

test("keeps offline work available but rejects deploy on a non-LTS Node major", async (t) => {
  const applicationRoot = await ciCreateApplication(t);
  const localStore = await ciCreateResourceStudioLocalStore({
    applicationRoot,
  });
  const calls = [];
  const runtime = ciCreateResourceStudioAwsRuntime({
    applicationRoot,
    localStore,
    nodeVersion: "25.4.0",
    runCommand: async (input) => {
      calls.push(input);
      return { exitCode: 0, stdout: "", stderr: "" };
    },
  });

  assert.equal((await runtime.getSettings()).nodeRuntime.supported, false);
  await assert.rejects(
    runtime.deploy({ profile: "developer-sso", identifier: "ci-books" }),
    (error) =>
      error.code === "CI_RESOURCE_STUDIO_UNSUPPORTED_NODE_RUNTIME" &&
      /offline Data Entity editing remains available/.test(error.message),
  );
  assert.equal(calls.length, 0);
});

test("uses environment region precedence and pins the verified region", async (t) => {
  const applicationRoot = await ciCreateApplication(t);
  const localStore = await ciCreateResourceStudioLocalStore({
    applicationRoot,
  });
  const calls = [];
  const runtime = ciCreateResourceStudioAwsRuntime({
    applicationRoot,
    localStore,
    nodeVersion: "24.4.0",
    environment: {
      AWS_REGION: "me-central-1",
      AWS_DEFAULT_REGION: "eu-central-1",
    },
    runCommand: async (input) => {
      calls.push(input);
      if (input.args[0] === "sts") {
        return {
          exitCode: 0,
          stdout: JSON.stringify({ Account: "1", Arn: "arn", UserId: "user" }),
          stderr: "",
        };
      }
      assert.equal(input.command, "ampx");
      return { exitCode: 0, stdout: "done", stderr: "" };
    },
  });

  const verified = await runtime.preflight({
    profile: "developer-sso",
    identifier: "ci-books",
    planHash: CI_TEST_PLAN_HASH,
  });
  assert.equal(verified.region, "me-central-1");
  assert.equal(verified.regionSource, "AWS_REGION");
  await runtime.deploy({
    profile: "developer-sso",
    identifier: "ci-books",
    planHash: CI_TEST_PLAN_HASH,
    intentId: verified.intentId,
  });
  assert.equal(
    calls.some((call) => call.args[0] === "configure"),
    false,
  );
  assert.deepEqual(calls.at(-1).env, {
    AWS_REGION: "me-central-1",
    AWS_DEFAULT_REGION: "me-central-1",
  });
});

test("rejects expired intents and AWS identity drift before ampx", async (t) => {
  const applicationRoot = await ciCreateApplication(t);
  const localStore = await ciCreateResourceStudioLocalStore({
    applicationRoot,
  });
  let currentTime = Date.parse("2026-08-16T00:00:00.000Z");
  let account = "111111111111";
  const calls = [];
  const runtime = ciCreateResourceStudioAwsRuntime({
    applicationRoot,
    localStore,
    nodeVersion: "22.18.0",
    environment: { AWS_DEFAULT_REGION: "us-west-2" },
    now: () => currentTime,
    deploymentIntentTtlMs: 1_000,
    runCommand: async (input) => {
      calls.push(input);
      if (input.args[0] === "sts") {
        return {
          exitCode: 0,
          stdout: JSON.stringify({
            Account: account,
            Arn: "arn",
            UserId: "user",
          }),
          stderr: "",
        };
      }
      throw new Error("ampx must not run");
    },
  });

  const expiring = await runtime.preflight({
    profile: "developer-sso",
    identifier: "ci-books",
    planHash: CI_TEST_PLAN_HASH,
  });
  currentTime += 1_000;
  await assert.rejects(
    runtime.deploy({
      profile: "developer-sso",
      identifier: "ci-books",
      planHash: CI_TEST_PLAN_HASH,
      intentId: expiring.intentId,
    }),
    (error) => error.code === "CI_RESOURCE_STUDIO_DEPLOYMENT_INTENT_EXPIRED",
  );

  currentTime += 1;
  const drifting = await runtime.preflight({
    profile: "developer-sso",
    identifier: "ci-books",
    planHash: CI_TEST_PLAN_HASH,
  });
  account = "222222222222";
  await assert.rejects(
    runtime.deploy({
      profile: "developer-sso",
      identifier: "ci-books",
      planHash: CI_TEST_PLAN_HASH,
      intentId: drifting.intentId,
    }),
    (error) => error.code === "CI_RESOURCE_STUDIO_AWS_IDENTITY_DRIFT",
  );
  assert.equal(
    calls.some((call) => call.command === "ampx"),
    false,
  );
});
