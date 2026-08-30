import assert from "node:assert/strict";
import test from "node:test";

import {
  CI_CORE_BACKEND_MANIFEST,
  CI_ENV,
  ciApplyCorePostBuildPlan,
  ciCreateCorePostBuildPlan,
  type CiCoreFunctionId,
  type CiCoreRuntime,
} from "@ci-aws/server/backend";
import { ciAssertSingleDynamoPermissionSource } from "@ci-aws/server/backend/policy/ci-prepare-policy";

const USER_PROFILE_TABLE_NAME = "ci-user-profile-sandbox";
const USER_PROFILE_TABLE_ARN =
  "arn:aws:dynamodb:me-central-1:123456789012:table/ci-user-profile-sandbox";
const EMBERGUARD_ACCESS_TABLE_NAME = "ci-emberguard-access-sandbox";
const EMBERGUARD_ACCESS_TABLE_ARN =
  "arn:aws:dynamodb:me-central-1:123456789012:table/ci-emberguard-access-sandbox";
const SYSTEM_TABLE_NAME = "ci-system-sandbox";
const SYSTEM_TABLE_ARN =
  "arn:aws:dynamodb:me-central-1:123456789012:table/ci-system-sandbox";

const TEST_IAM_MODULE = {
  Policy: class {},
  PolicyStatement: class {},
  Effect: { ALLOW: "Allow", DENY: "Deny" },
};

/** Creates a realistic minimal runtime without requiring Amplify constructs. */
function createRuntime(): CiCoreRuntime {
  return {
    resources: {
      userProfileTable: {
        name: USER_PROFILE_TABLE_NAME,
        arn: USER_PROFILE_TABLE_ARN,
      },
      emberguardAccessTable: {
        name: EMBERGUARD_ACCESS_TABLE_NAME,
        arn: EMBERGUARD_ACCESS_TABLE_ARN,
      },
      systemTable: { name: SYSTEM_TABLE_NAME, arn: SYSTEM_TABLE_ARN },
      auth: { enabled: true },
    },
    region: "me-central-1",
    envMode: "sandbox",
  };
}

/** Produces the active core plan used by all invariant assertions in this file. */
function createPlan() {
  return ciCreateCorePostBuildPlan(
    createRuntime(),
    {
      includeAuthEnv: true,
      includeDefaultDynamoPolicies: true,
      authParams: {
        userPoolIdParam: "/cloudigniter/sandbox/auth/user-pool-id",
        userPoolArnParam: "/cloudigniter/sandbox/auth/user-pool-arn",
      },
    },
    {
      auth: {
        userPoolId: "me-central-1_example",
        userPoolArn:
          "arn:aws:cognito-idp:me-central-1:123456789012:userpool/me-central-1_example",
      },
    },
  );
}

test("builds environment only for active handlers and includes global context", () => {
  const plan = createPlan();
  const activeHandlers = new Set<string>(CI_CORE_BACKEND_MANIFEST.handlerIds);

  assert.deepEqual(Object.keys(plan.env).sort(), [...activeHandlers].sort());

  for (const [handlerId, env] of Object.entries(plan.env)) {
    assert.equal(
      activeHandlers.has(handlerId),
      true,
      `${handlerId} must be active`,
    );
    assert.equal(env?.[CI_ENV.CI_REGION], "me-central-1");
    assert.equal(env?.[CI_ENV.CI_ENV_MODE], "sandbox");
  }
});

test("configures every active Cognito handler through the package plan", () => {
  const plan = createPlan();
  const cognitoHandlers = [
    "ciCreateCognitoUserHandler",
    "ciGetCognitoUserHandler",
    "ciSetCognitoUserPasswordHandler",
  ] as const;

  for (const handlerId of cognitoHandlers) {
    const env = plan.env[handlerId];

    assert.ok(env, `${handlerId} must have a post-build environment`);
    assert.equal(env[CI_ENV.CI_USER_POOL_ID], "me-central-1_example");
    assert.equal(
      env[CI_ENV.CI_USER_POOL_ARN],
      "arn:aws:cognito-idp:me-central-1:123456789012:userpool/me-central-1_example",
    );
    assert.equal(
      env[CI_ENV.CI_USER_POOL_ID_PARAM],
      "/cloudigniter/sandbox/auth/user-pool-id",
    );
    assert.equal(
      env[CI_ENV.CI_USER_POOL_ARN_PARAM],
      "/cloudigniter/sandbox/auth/user-pool-arn",
    );
  }
});

test("does not create an auth-to-data dependency for unused profile table values", () => {
  const plan = createPlan();
  const consumers = Object.entries(plan.env).filter(
    ([, env]) => env?.[CI_ENV.CI_USER_PROFILE_TABLE_NAME] !== undefined,
  );

  assert.deepEqual(consumers, []);
  assert.equal(
    plan.env.ciCreateCognitoUserHandler?.[CI_ENV.CI_USER_PROFILE_TABLE_ARN],
    undefined,
  );
});

test("targets only active handlers and resources in policy output", () => {
  const plan = createPlan();
  const activeHandlers = new Set<string>(CI_CORE_BACKEND_MANIFEST.handlerIds);
  const activeResources = new Set<string>(CI_CORE_BACKEND_MANIFEST.resourceIds);

  for (const policy of plan.inlinePolicies) {
    assert.equal(
      activeHandlers.has(policy.for),
      true,
      `${policy.for} must be active`,
    );
  }

  for (const grant of plan.tableGrants) {
    assert.equal(
      activeHandlers.has(grant.for),
      true,
      `${grant.for} must be active`,
    );
    assert.equal(
      activeResources.has(grant.table),
      true,
      `${grant.table} must be active`,
    );
  }

  assert.deepEqual(
    plan.tableGrants,
    [],
    "unimplemented user-profile handlers must not receive grants",
  );
});

test("does not grant DynamoDB access twice to the same handler", () => {
  const plan = createPlan();
  const inlineDynamoHandlers = new Set<CiCoreFunctionId>(
    plan.inlinePolicies
      .filter((policy) =>
        policy.statements.some((statement) =>
          statement.actions.some((action) => action.startsWith("dynamodb:")),
        ),
      )
      .map((policy) => policy.for),
  );
  const tableGrantHandlers = new Set<CiCoreFunctionId>(
    plan.tableGrants.map((grant) => grant.for),
  );
  const duplicatePermissionHandlers = [...inlineDynamoHandlers].filter(
    (handler) => tableGrantHandlers.has(handler),
  );

  assert.deepEqual(duplicatePermissionHandlers, []);
});

test("grants mutation handlers transactional projection permissions", () => {
  const plan = createPlan();
  for (const handlerId of [
    "ciPutEmberguardRoleAssignmentHandler",
    "ciDeleteEmberguardRoleAssignmentHandler",
  ] as const) {
    const actions = new Set(
      plan.inlinePolicies
        .filter((policy) => policy.for === handlerId)
        .flatMap((policy) =>
          policy.statements.flatMap((statement) => statement.actions),
        ),
    );
    assert.equal(actions.has("dynamodb:GetItem"), true, handlerId);
    assert.equal(actions.has("dynamodb:Query"), true, handlerId);
    assert.equal(actions.has("dynamodb:PutItem"), true, handlerId);
    assert.equal(actions.has("dynamodb:DeleteItem"), true, handlerId);
    assert.equal(actions.has("dynamodb:TransactWriteItems"), true, handlerId);
  }

  const definitionActions = new Set(
    plan.inlinePolicies
      .filter((policy) => policy.for === "ciSetEmberguardDefinitionHandler")
      .flatMap((policy) =>
        policy.statements.flatMap((statement) => statement.actions),
      ),
  );
  assert.equal(definitionActions.has("dynamodb:GetItem"), true);
  assert.equal(definitionActions.has("dynamodb:Query"), true);
  assert.equal(definitionActions.has("dynamodb:PutItem"), true);
  assert.equal(definitionActions.has("dynamodb:DeleteItem"), false);
  assert.equal(definitionActions.has("dynamodb:TransactWriteItems"), true);
});

test("allows the definition reader to initialize a missing state", () => {
  const actions = new Set(
    createPlan()
      .inlinePolicies.filter(
        (policy) => policy.for === "ciGetEmberguardDefinitionHandler",
      )
      .flatMap((policy) =>
        policy.statements.flatMap((statement) => statement.actions),
      ),
  );

  assert.equal(actions.has("dynamodb:GetItem"), true);
  assert.equal(actions.has("dynamodb:Query"), true);
  assert.equal(actions.has("dynamodb:PutItem"), true);
  assert.equal(actions.has("dynamodb:TransactWriteItems"), false);
  assert.equal(actions.has("dynamodb:Scan"), false);
});

test("rejects mixed DynamoDB permission representations", () => {
  assert.throws(
    () =>
      ciAssertSingleDynamoPermissionSource({
        inlinePolicies: [
          {
            for: "ciCreateCognitoUserHandler",
            statements: [
              {
                effect: "Allow",
                actions: ["dynamodb:GetItem"],
                resources: [USER_PROFILE_TABLE_ARN],
              },
            ],
          },
        ],
        tableGrants: [
          {
            for: "ciCreateCognitoUserHandler",
            table: "userProfileTable",
            actions: ["GetItem"],
          },
        ],
      }),
    /must not mix inline DynamoDB policies with table grants/i,
  );
});

test("strict apply rejects a missing active function construct", () => {
  assert.throws(
    () =>
      ciApplyCorePostBuildPlan(createPlan(), {
        iamModule: TEST_IAM_MODULE,
        functions: {},
        includeFunctions: ["ciCreateCognitoUserHandler"],
        strict: true,
      }),
    /missing function construct.*ciCreateCognitoUserHandler/i,
  );
});

test("strict apply rejects a missing table ARN before mutation", () => {
  const plan = createPlan();
  plan.tableGrants.push({
    for: "ciCreateCognitoUserHandler",
    table: "userProfileTable",
    actions: ["GetItem"],
  });

  assert.throws(
    () =>
      ciApplyCorePostBuildPlan(plan, {
        iamModule: TEST_IAM_MODULE,
        functions: {
          ciCreateCognitoUserHandler: {
            addEnvironment: () => undefined,
            role: { attachInlinePolicy: () => undefined },
          },
        },
        includeFunctions: ["ciCreateCognitoUserHandler"],
        applyTableGrants: true,
        tableArns: {},
        strict: true,
      }),
    /missing ARN.*userProfileTable/i,
  );
});
