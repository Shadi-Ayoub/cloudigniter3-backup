import assert from "node:assert/strict";
import test from "node:test";

import {
  ciCompileAmplifyBackendBindings,
  ciCompileAmplifyDataBindings,
  ciCreateAmplifyCoreRuntime,
  ciDefineAmplifyBackendManifest,
  ciGetAmplifyFunctionBindings,
  ciGetAmplifyFunctionResourcesFromBindings,
  ciMergeAmplifyBackendResources,
} from "../../src/server/backend/amplify";

test("projects typed Amplify function and table bindings", () => {
  const resource = { factory: true };
  const manifest = ciDefineAmplifyBackendManifest({
    features: {
      authFeature: {
        status: "active",
        resourceGroupName: "auth",
        functions: {
          ciCreateCognitoUserHandler: {
            backendKey: "createUser",
            resource,
          },
        },
      },
    },
  });

  const bindings = ciGetAmplifyFunctionBindings(manifest, "auth");
  assert.deepEqual(ciGetAmplifyFunctionResourcesFromBindings(bindings), {
    createUser: resource,
  });
  assert.deepEqual(
    ciCompileAmplifyBackendBindings(
      { handlerIds: ["ciCreateCognitoUserHandler"], tableKeys: [] },
      manifest,
    ).functionResources,
    { createUser: resource },
  );

  assert.deepEqual(
    ciCompileAmplifyDataBindings(
      { Invoice: { tableName: "Invoices", tableArn: "arn:invoice" } },
      {
        invoiceTable: { modelName: "Invoice", outputName: "invoiceTableName" },
      },
    ),
    {
      tables: { invoiceTable: { name: "Invoices", arn: "arn:invoice" } },
      tableArns: { invoiceTable: "arn:invoice" },
      outputs: { invoiceTableName: "Invoices" },
    },
  );
});

test("protects core backend resource keys", () => {
  assert.throws(
    () => ciMergeAmplifyBackendResources({ auth: {} }, { auth: {} }),
    /cannot be overridden/i,
  );
  assert.deepEqual(
    ciMergeAmplifyBackendResources({ auth: {} }, { billing: {} }),
    { auth: {}, billing: {} },
  );
});

test("creates provider-neutral runtime state for the post-build planner", () => {
  assert.deepEqual(
    ciCreateAmplifyCoreRuntime({
      region: "us-east-1",
      tables: {
        emberguardAccessTable: {
          name: "EmberguardAccess",
          arn: "arn:emberguard-access",
        },
        userProfileTable: { name: "Profiles", arn: "arn:profiles" },
      },
    }),
    {
      region: "us-east-1",
      envMode: "live",
      resources: {
        emberguardAccessTable: {
          name: "EmberguardAccess",
          arn: "arn:emberguard-access",
        },
        userProfileTable: { name: "Profiles", arn: "arn:profiles" },
        auth: { enabled: true },
      },
    },
  );
});
