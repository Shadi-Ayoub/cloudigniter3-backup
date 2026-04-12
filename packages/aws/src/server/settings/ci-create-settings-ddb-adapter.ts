import type { CiSettings } from "@cloudigniter/core";
import type {
  CiSettingsDdbAdapter,
  CiSettingsDeleteItemInput,
  CiSettingsGetItemInput,
  CiSettingsKey,
  CiSettingsPutItemInput,
  CiSettingsTableItem,
} from "@cloudigniter/core/server";
import { Dynamodb } from "../";

/**
 * Create a settings-specific DynamoDB adapter from the CloudIgniter Dynamodb
 * abstraction.
 *
 * This adapter translates the generic settings-store contract into calls to the
 * CloudIgniter DynamoDB wrapper.
 *
 * Notes:
 * - read results are returned from `ciResult.body.item`
 * - write/delete failures throw using `ciResult.body.error`
 * - delete uses `existence: "deleteOnly"` to enforce existence checks
 *
 * @param ddb - Initialized CloudIgniter Dynamodb instance.
 * @returns Settings DynamoDB adapter.
 */
export function ciCreateSettingsDdbAdapter(
  ddb: Dynamodb,
): CiSettingsDdbAdapter {
  return {
    async getItem<TSettings extends CiSettings = CiSettings>(
      input: CiSettingsGetItemInput,
    ): Promise<CiSettingsTableItem<TSettings> | null> {
      const ciResult = await ddb.readItem<
        CiSettingsTableItem<TSettings>,
        CiSettingsKey
      >({
        tableName: input.tableName,
        key: input.key,
      });

      if (!ciResult.ok) {
        throw new Error(ciResult.body.error);
      }

      return ciResult.body.item ?? null;
    },

    async putItem<TSettings extends CiSettings = CiSettings>(
      input: CiSettingsPutItemInput<TSettings>,
    ): Promise<void> {
      const ciResult = await ddb.writeItem<
        CiSettingsTableItem<TSettings>,
        CiSettingsKey
      >({
        tableName: input.tableName,
        key: {
          PK: input.item.PK,
          SK: input.item.SK,
        },
        item: input.item,
        mode: "put",
        existence: "any",
        returnValues: "NONE",
        timestamps: false,
      });

      if (!ciResult.ok) {
        throw new Error(ciResult.body.error);
      }
    },

    async deleteItem(input: CiSettingsDeleteItemInput): Promise<boolean> {
      const ciResult = await ddb.deleteItem<
        CiSettingsTableItem<CiSettings>,
        CiSettingsKey
      >({
        tableName: input.tableName,
        key: input.key,
        existence: "deleteOnly",
      });

      if (!ciResult.ok) {
        throw new Error(ciResult.body.error);
      }

      return true;
    },
  };
}
