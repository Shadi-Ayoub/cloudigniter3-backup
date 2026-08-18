import assert from "node:assert/strict";
import test from "node:test";

import { ciRunAmplifySandboxDeploy } from "../src/workers/amplify/sandbox-deploy.mjs";

const planHash = "a".repeat(64);

test("headless deploy verifies the plan and identity before consuming its intent", async () => {
  const calls = [];
  const output = [];
  const localStore = { name: "local-store" };
  const service = {
    applicationRoot: "/resolved-application",
    async getDeploymentPlanHash() {
      calls.push("plan-hash");
      return planHash;
    },
  };
  const awsRuntime = {
    async preflight(input) {
      calls.push(["preflight", input]);
      return {
        account: "123456789012",
        arn: "arn:aws:sts::123456789012:assumed-role/Developer/example",
        region: "eu-west-1",
        intentId: "verified-intent",
      };
    },
    async deploy(input) {
      calls.push(["deploy", input]);
      return {
        status: "completed",
        profile: input.profile,
        identifier: input.identifier,
      };
    },
  };

  const result = await ciRunAmplifySandboxDeploy({
    applicationRoot: "/application",
    profile: "developer-sso",
    identifier: "ci-books",
    nodeVersion: "24.1.0",
    writeOutput: (message) => output.push(message),
    loadRuntime: async () => ({
      ciInspectResourceStudioNodeRuntime(version) {
        calls.push(["node-runtime", version]);
        return {
          version,
          supported: true,
          supportedMajors: [22, 24],
        };
      },
      async ciCreateResourceStudioLocalStore(input) {
        calls.push(["local-store", input]);
        return localStore;
      },
      async ciCreateResourceStudioService(input) {
        calls.push(["service", input]);
        return service;
      },
      ciCreateResourceStudioAwsRuntime(input) {
        calls.push(["aws-runtime", input]);
        return awsRuntime;
      },
    }),
  });

  assert.equal(result.status, "completed");
  assert.deepEqual(calls, [
    ["node-runtime", "24.1.0"],
    ["service", { applicationRoot: "/application" }],
    ["local-store", { applicationRoot: "/resolved-application" }],
    ["aws-runtime", { applicationRoot: "/resolved-application", localStore }],
    "plan-hash",
    [
      "preflight",
      {
        profile: "developer-sso",
        identifier: "ci-books",
        planHash,
      },
    ],
    "plan-hash",
    [
      "deploy",
      {
        profile: "developer-sso",
        identifier: "ci-books",
        planHash,
        intentId: "verified-intent",
      },
    ],
  ]);
  assert.deepEqual(output, [
    "AWS account: 123456789012",
    "AWS ARN: arn:aws:sts::123456789012:assumed-role/Developer/example",
    "AWS region: eu-west-1",
    "Amplify sandbox ci-books completed with profile developer-sso.",
  ]);
});

test("headless deploy rejects unsupported Node before local state or AWS setup", async () => {
  let initialized = false;

  await assert.rejects(
    ciRunAmplifySandboxDeploy({
      applicationRoot: "/application",
      profile: "developer-sso",
      identifier: "ci-books",
      nodeVersion: "25.0.0",
      loadRuntime: async () => ({
        ciInspectResourceStudioNodeRuntime(version) {
          return {
            version,
            supported: false,
            supportedMajors: [22, 24],
          };
        },
        async ciCreateResourceStudioLocalStore() {
          initialized = true;
        },
      }),
    }),
    /supported Node LTS \(22, 24\)/,
  );

  assert.equal(initialized, false);
});

test("headless deploy supplies a refreshed plan hash for intent drift rejection", async () => {
  const refreshedPlanHash = "b".repeat(64);
  let hashReads = 0;
  let deployInput;
  const service = {
    applicationRoot: "/application",
    async getDeploymentPlanHash() {
      hashReads += 1;
      return hashReads === 1 ? planHash : refreshedPlanHash;
    },
  };

  await assert.rejects(
    ciRunAmplifySandboxDeploy({
      applicationRoot: "/application",
      profile: "developer-sso",
      identifier: "ci-books",
      nodeVersion: "24.1.0",
      writeOutput() {},
      loadRuntime: async () => ({
        ciInspectResourceStudioNodeRuntime: (version) => ({
          version,
          supported: true,
          supportedMajors: [22, 24],
        }),
        ciCreateResourceStudioLocalStore: async () => ({}),
        ciCreateResourceStudioService: async () => service,
        ciCreateResourceStudioAwsRuntime: () => ({
          preflight: async () => ({
            account: "123456789012",
            arn: "arn:aws:sts::123456789012:assumed-role/Developer/example",
            region: "eu-west-1",
            intentId: "verified-intent",
          }),
          async deploy(input) {
            deployInput = input;
            throw new Error("generated plan changed after preflight");
          },
        }),
      }),
    }),
    /plan changed after preflight/,
  );

  assert.equal(hashReads, 2);
  assert.equal(deployInput.planHash, refreshedPlanHash);
});
