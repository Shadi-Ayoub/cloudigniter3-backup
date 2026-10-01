import assert from "node:assert/strict";
import test from "node:test";
import { App, NestedStack, Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { ciConfigureModulesBackend } from "../modules";
import type { CiBackend } from "../types";

test("module infrastructure synthesizes in the Data stack without provisioning optional task data", () => {
  const app = new App();
  const root = new Stack(app, "ModuleTest", {
    env: { region: "us-east-1", account: "123456789012" },
  });
  const data = new NestedStack(root, "Data");
  const wrap = (name: string) => {
    const lambda = new Function(data, name, {
      runtime: Runtime.NODEJS_22_X,
      handler: "index.handler",
      code: Code.fromInline("exports.handler = async () => null;"),
    });
    return {
      resources: { lambda },
      addEnvironment: (key: string, value: string) =>
        lambda.addEnvironment(key, value),
    };
  };
  const access = new Table(data, "Access", {
    partitionKey: { name: "PK", type: AttributeType.STRING },
  });
  const backend = {
    stack: root,
    manageModulesHandler: wrap("Manager"),
    executeModuleHandler: wrap("Executor"),
    data: { resources: { tables: { EmberguardAccess: access } } },
  } as unknown as CiBackend;
  ciConfigureModulesBackend(backend);
  const template = Template.fromStack(data);
  template.resourceCountIs("AWS::DynamoDB::Table", 2);
  template.hasResource("AWS::DynamoDB::Table", {
    DeletionPolicy: "Retain",
    Properties: {
      BillingMode: "PAY_PER_REQUEST",
      KeySchema: [
        { AttributeName: "PK", KeyType: "HASH" },
        { AttributeName: "SK", KeyType: "RANGE" },
      ],
    },
  });
  template.resourceCountIs("AWS::Lambda::Function", 2);
  const resources = template.toJSON().Resources;
  const functions = Object.values(resources).filter(
    (item: any) => item.Type === "AWS::Lambda::Function",
  ) as any[];
  for (const fn of functions) {
    assert.ok(fn.Properties.Environment.Variables.CI_EMBERGUARD_ACCESS_TABLE);
    assert.ok(fn.Properties.Environment.Variables.CI_MODULES_TABLE_NAME);
    assert.ok(fn.Properties.Environment.Variables.CI_MODULES_PREFIX);
  }
  const policies = Object.values(resources).filter(
    (item: any) => item.Type === "AWS::IAM::Policy",
  ) as any[];
  const statements = policies.flatMap(
    (policy) => policy.Properties.PolicyDocument.Statement,
  );
  const deletion = statements.find((statement) =>
    (statement.Action as string[]).includes("cloudformation:DeleteStack"),
  );
  assert.ok(deletion);
  assert.notEqual(deletion.Resource, "*");
  assert.match(JSON.stringify(deletion.Resource), /ci-ext-/);
  const passRole = statements.find(
    (statement) => statement.Action === "iam:PassRole",
  );
  assert.deepEqual(passRole.Condition, {
    StringEquals: { "iam:PassedToService": "cloudformation.amazonaws.com" },
  });
});
