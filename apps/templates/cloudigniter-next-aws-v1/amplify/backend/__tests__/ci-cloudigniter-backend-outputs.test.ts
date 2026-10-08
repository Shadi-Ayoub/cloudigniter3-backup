import assert from "node:assert/strict";
import test from "node:test";

import { ciCreateCloudIgniterBackendOutputs } from "../ci-cloudigniter-backend-outputs";

test("publishes the access-control bootstrap handler with table outputs", () => {
  assert.deepEqual(
    ciCreateCloudIgniterBackendOutputs({
      tableOutputs: {
        userProfileTableName: "UserProfile-example",
        emberguardAccessTableName: "EmberguardAccess-example",
      },
      emberguardAccessBootstrapFunctionName:
        "amplify-example-getemberguarddefinition-example",
    }),
    {
      custom: {
        cloudigniter: {
          userProfileTableName: "UserProfile-example",
          emberguardAccessTableName: "EmberguardAccess-example",
          emberguardAccessBootstrapFunctionName:
            "amplify-example-getemberguarddefinition-example",
        },
      },
    },
  );
});
