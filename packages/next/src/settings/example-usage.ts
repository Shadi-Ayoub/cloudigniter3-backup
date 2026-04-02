import { ciCreateSettingsStore } from "./server/ci-create-settings-store";
import { ciGetSettingsRecord } from "./server/ci-get-settings-record";
import { ciSetSettings } from "./server/ci-set-settings";
import { ciDeleteSettings } from "./server/ci-delete-settings";

const ciStore = ciCreateSettingsStore();

await ciSetSettings(ciStore, {
  settingsId: "core",
  scope: "public",
  targetTenantScope: "global",
  value: {
    applicationName: "CloudIgniter",
  },
});

const ciRecord = await ciGetSettingsRecord(ciStore, {
  settingsId: "core",
  scope: "public",
  targetTenantScope: "global",
});

await ciDeleteSettings(ciStore, {
  settingsId: "core",
  scope: "public",
  targetTenantScope: "global",
});

import { ciCreateSettingsService } from "./server/ci-create-settings-service";
// import { ciCreateSettingsStore } from './server/ci-create-settings-store';
import { ciDefineSettingsRegistry } from "./common/ci-define-settings-registry";

type CiAppSettings = {
  applicationName: string;
  features: {
    enableTraceBeacon: boolean;
  };
};

const ciRegistry = ciDefineSettingsRegistry({
  core: {
    scope: "public",
    defaults: {
      applicationName: "CloudIgniter",
      features: {
        enableTraceBeacon: false,
      },
    } satisfies CiAppSettings,
    schema: {
      parse(value) {
        return value as CiAppSettings;
      },
    },
  },
});

// const ciStore = ciCreateSettingsStore();
const ciService = ciCreateSettingsService(ciStore);

await ciService.setRecord({
  settingsId: "core",
  scope: "public",
  targetTenantScope: "global",
  value: {
    applicationName: "CloudIgniter Platform",
  },
});

const ciResolved = await ciService.getResolved<CiAppSettings>({
  registry: ciRegistry,
  settingsId: "core",
  scope: "public",
});

console.log(ciResolved.value.applicationName);

import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

import { ciCreateDynamoSettingsStore } from "./server/ci-create-dynamo-settings-store";
// import { ciCreateSettingsService } from "./server/ci-create-settings-service";

const ciDdbClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const ciStore2 = ciCreateDynamoSettingsStore({
  client: ciDdbClient,
  publicSettingsTableName: "PublicSettings",
  privateSettingsTableName: "PrivateSettings",
  userSettingsTableName: "UserSettings",
});

const ciService1 = ciCreateSettingsService(ciStore2);
