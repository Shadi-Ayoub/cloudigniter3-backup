import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import {
  ciBuildTableKeys,
  ciValidateExtensionManifest,
} from "@cloudigniter/core/lib";
import type {
  CiExtensionSnapshot,
  CiExtensionStore,
} from "@cloudigniter/core/types";

export const ciExtensionRegistryKey = () =>
  ciBuildTableKeys({ partition: ["MODULES", "REGISTRY"], sort: ["STATE"] });

export function ciCreateAwsExtensionStore(
  client: DynamoDBDocumentClient,
  tableName: string,
): CiExtensionStore {
  if (!tableName)
    throw new Error("Deploy the Modules backend before using extensions.");
  return {
    async read() {
      const result = await client.send(
        new GetCommand({
          TableName: tableName,
          Key: ciExtensionRegistryKey(),
          ConsistentRead: true,
        }),
      );
      if (!result.Item) return { revision: 0, installations: {} };
      const state = result.Item.state as CiExtensionSnapshot | undefined;
      if (
        !state ||
        !Number.isSafeInteger(state.revision) ||
        state.revision < 1 ||
        !state.installations ||
        typeof state.installations !== "object" ||
        Array.isArray(state.installations)
      )
        throw new Error("Invalid module registry; access is blocked.");
      for (const [id, record] of Object.entries(state.installations)) {
        ciValidateExtensionManifest(record.manifest);
        if (
          record.manifest.id !== id ||
          ![
            "installing",
            "enabled",
            "disabled",
            "uninstalling",
            "failed",
          ].includes(record.status)
        )
          throw new Error("Invalid module installation; access is blocked.");
      }
      return state;
    },
    async write(state, expectedRevision) {
      if (Buffer.byteLength(JSON.stringify(state)) > 300_000)
        throw new Error("Module registry capacity exceeded.");
      await client.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            ...ciExtensionRegistryKey(),
            state,
            revision: state.revision,
          },
          ConditionExpression:
            expectedRevision === 0
              ? "attribute_not_exists(PK)"
              : "revision = :revision",
          ...(expectedRevision === 0
            ? {}
            : { ExpressionAttributeValues: { ":revision": expectedRevision } }),
        }),
      );
    },
  };
}
