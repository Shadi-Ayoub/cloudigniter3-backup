import type { Dynamodb } from "@cloudigniter/core/server";
import type { CiSettings } from "../common/types/CiSettings";
import type { CiSettingsDdbAdapter } from "./types/CiSettingsDdbAdapter";
import type { CiSettingsTableItem } from "./types/CiSettingsTableItem";

/**
 * Create a settings-specific DynamoDB adapter from the CloudIgniter Dynamodb
 * abstraction.
 *
 * @param ddb - Initialized CloudIgniter Dynamodb instance.
 * @returns Settings DynamoDB adapter.
 */
export function ciCreateSettingsDdbAdapter(
  ddb: Dynamodb,
): CiSettingsDdbAdapter {
  return {
    async getItem<TSettings extends CiSettings = CiSettings>(
      input,
    ): Promise<CiSettingsTableItem<TSettings> | null> {
      const ciResult = await ddb.readItem<
        CiSettingsTableItem<TSettings>,
        { PK: string; SK: string }
      >({
        tableName: input.tableName,
        key: input.key,
      });

      if (!ciResult.ok) {
        throw new Error(ciResult.error);
      }

      return ciResult.data ?? null;
    },

    async putItem<TSettings extends CiSettings = CiSettings>(
      input,
    ): Promise<void> {
      const ciResult = await ddb.writeItem<
        CiSettingsTableItem<TSettings>,
        { PK: string; SK: string }
      >({
        tableName: input.tableName,
        key: {
          PK: input.item.PK,
          SK: input.item.SK,
        },
        mode: "put",
        existence: "any",
        returnValues: "NONE",
        timestamps: false,
        item: input.item,
      });

      if (!ciResult.ok) {
        throw new Error(ciResult.error);
      }
    },

    async deleteItem(input): Promise<boolean> {
      const ciResult = await ddb.deleteItem<{ PK: string; SK: string }>({
        tableName: input.tableName,
        key: input.key,
        mode: "deleteOnly",
      });

      if (!ciResult.ok) {
        throw new Error(ciResult.error);
      }

      return true;
    },
  };
}
