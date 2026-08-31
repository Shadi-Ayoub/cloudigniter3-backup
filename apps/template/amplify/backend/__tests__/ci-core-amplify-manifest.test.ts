import assert from "node:assert/strict";
import test from "node:test";

import {
  CI_CORE_BACKEND_MANIFEST,
  ciAssertAmplifyBackendContract,
  ciDefineAmplifyBackendManifest,
} from "@cloudigniter/aws/server/backend";

import {
  CI_CORE_AMPLIFY_AUTH_FUNCTION_BINDINGS,
  CI_CORE_AMPLIFY_DATA_FUNCTION_BINDINGS,
  CI_CORE_AMPLIFY_FUNCTION_BINDINGS,
  CI_CORE_AMPLIFY_FUNCTION_RESOURCES,
  CI_CORE_AMPLIFY_MANIFEST,
  CI_CORE_AMPLIFY_TABLE_BINDINGS,
} from "../ci-core-amplify-manifest";
import { CI_COGNITO_USER_ADMIN_GROUPS } from "../../data/schemata/schema-cognito-user";

test("admits both technical administrator groups to Cognito operations", () => {
  assert.deepEqual(CI_COGNITO_USER_ADMIN_GROUPS, [
    "system-admin",
    "system-super-admin",
  ]);
});

test("projects every active package binding into the Amplify backend", () => {
  assert.deepEqual(
    Object.keys(CI_CORE_AMPLIFY_FUNCTION_BINDINGS).sort(),
    [...CI_CORE_BACKEND_MANIFEST.handlerIds].sort(),
  );
  assert.deepEqual(
    Object.keys(CI_CORE_AMPLIFY_TABLE_BINDINGS).sort(),
    [...CI_CORE_BACKEND_MANIFEST.tableKeys].sort(),
  );

  const groupedFunctionIds = [
    ...Object.keys(CI_CORE_AMPLIFY_AUTH_FUNCTION_BINDINGS),
    ...Object.keys(CI_CORE_AMPLIFY_DATA_FUNCTION_BINDINGS),
  ];
  assert.deepEqual(
    groupedFunctionIds.sort(),
    Object.keys(CI_CORE_AMPLIFY_FUNCTION_BINDINGS).sort(),
  );

  const backendKeys = Object.values(CI_CORE_AMPLIFY_FUNCTION_BINDINGS).map(
    (binding) => binding.backendKey,
  );
  assert.deepEqual(
    Object.keys(CI_CORE_AMPLIFY_FUNCTION_RESOURCES).sort(),
    backendKeys.sort(),
  );
});

test("preserves the User Profile data model and output binding", () => {
  assert.deepEqual(CI_CORE_AMPLIFY_TABLE_BINDINGS.userProfileTable, {
    modelName: "UserProfile",
    outputName: "userProfileTableName",
  });
});

test("rejects drift from the active package contract", () => {
  assert.throws(
    () =>
      ciAssertAmplifyBackendContract(
        {
          handlerIds: [],
          tableKeys: CI_CORE_BACKEND_MANIFEST.tableKeys,
        },
        CI_CORE_AMPLIFY_MANIFEST,
      ),
    /active package contract and Amplify bindings are out of sync/i,
  );
});

test("rejects function bindings that overwrite reserved backend resources", () => {
  assert.throws(
    () =>
      ciDefineAmplifyBackendManifest({
        features: {
          invalid: {
            status: "active",
            resourceGroupName: "auth",
            functions: {
              ciCreateCognitoUserHandler: {
                backendKey: "auth",
                resource: {},
              },
            },
          },
        },
      }),
    /reserved backend key "auth"/i,
  );
});
