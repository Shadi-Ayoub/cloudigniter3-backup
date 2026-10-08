import { Fn, RemovalPolicy, Stack } from "aws-cdk-lib";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import {
  ciAwsExtensionPolicies,
  CI_ENV,
} from "@cloudigniter/aws/server/backend";
import { extensionManifests } from "../../src/custom/modules/.generated/manifests";
import type { CiBackend } from "./types";

/** Core composition: only the registry and execution boundary are deployed with Amplify. */
export function ciConfigureModulesBackend(backend: CiBackend) {
  const manager = backend.manageModulesHandler.resources.lambda;
  const executor = backend.executeModuleHandler.resources.lambda;
  const stack = Stack.of(manager);
  const identity = Fn.split(
    "-",
    Fn.select(2, Fn.split("/", backend.stack.stackId)),
  );
  const prefix = Fn.join("", [
    "ci-ext-",
    Fn.select(0, identity),
    Fn.select(1, identity),
  ]);
  const registry = new Table(stack, "CloudIgniterModuleRegistry", {
    partitionKey: { name: "PK", type: AttributeType.STRING },
    sortKey: { name: "SK", type: AttributeType.STRING },
    billingMode: BillingMode.PAY_PER_REQUEST,
    removalPolicy: RemovalPolicy.RETAIN,
  });
  const serviceRole = new Role(stack, "CloudIgniterModuleProvisioner", {
    assumedBy: new ServicePrincipal("cloudformation.amazonaws.com"),
  });
  const policies = ciAwsExtensionPolicies({
    prefix,
    ids: extensionManifests.map((item) => item.id),
    partition: stack.partition,
    account: stack.account,
    region: stack.region,
  });
  // Keep cleanup possible after a module folder is removed; the provider repeats exact ownership checks.
  serviceRole.addToPolicy(new PolicyStatement(policies.cleanupTables));
  manager.addToRolePolicy(new PolicyStatement(policies.cleanupStacks));
  if (policies.infrastructure.resources.length) {
    serviceRole.addToPolicy(new PolicyStatement(policies.infrastructure));
    manager.addToRolePolicy(new PolicyStatement(policies.lifecycle));
    executor.addToRolePolicy(new PolicyStatement(policies.data));
  }
  manager.addToRolePolicy(
    new PolicyStatement({
      actions: ["iam:PassRole"],
      resources: [serviceRole.roleArn],
      conditions: {
        StringEquals: { "iam:PassedToService": "cloudformation.amazonaws.com" },
      },
    }),
  );
  registry.grant(manager, "dynamodb:GetItem", "dynamodb:PutItem");
  registry.grant(executor, "dynamodb:GetItem", "dynamodb:ConditionCheckItem");
  const accessTable = backend.data.resources.tables.EmberguardAccess;
  if (!accessTable)
    throw new Error("Modules require the EmberGuard access table.");
  for (const fn of [
    backend.manageModulesHandler,
    backend.executeModuleHandler,
  ]) {
    accessTable.grant(
      fn.resources.lambda,
      "dynamodb:GetItem",
      "dynamodb:Query",
    );
    fn.addEnvironment("CI_MODULES_TABLE_NAME", registry.tableName);
    fn.addEnvironment("CI_MODULES_PREFIX", prefix);
    fn.addEnvironment("CI_ENV_MODE", process.env.CI_ENV_MODE ?? "production");
    fn.addEnvironment(
      CI_ENV.CI_EMBERGUARD_ACCESS_TABLE_NAME,
      accessTable.tableName,
    );
  }
  backend.manageModulesHandler.addEnvironment(
    "CI_MODULES_ACCOUNT",
    stack.account,
  );
  backend.manageModulesHandler.addEnvironment(
    "CI_MODULES_PARTITION",
    stack.partition,
  );
  backend.manageModulesHandler.addEnvironment(
    "CI_MODULES_SERVICE_ROLE_ARN",
    serviceRole.roleArn,
  );
}
