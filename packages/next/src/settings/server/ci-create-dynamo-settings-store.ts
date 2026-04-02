import type { CiSettings } from "../common/types/CiSettings";
import type { CiSettingsRecord } from "../common/types/CiSettingsRecord";
import { ciBuildSettingsKeys } from "./ci-build-settings-keys";
import { ciMapItemToSettingsRecord } from "./ci-map-item-to-settings-record";
import { ciMapSettingsRecordToItem } from "./ci-map-settings-record-to-item";
import { ciResolveSettingsTableName } from "./ci-resolve-settings-table-name";
import type { CiDeleteSettingsInput } from "./types/CiDeleteSettingsInput";
import type { CiCreateDynamoSettingsStoreInput } from "./types/CiCreateDynamoSettingsStoreInput";
import type { CiGetSettingsRecordInput } from "./types/CiGetSettingsRecordInput";
import type { CiSettingsStore } from "./types/CiSettingsStore";
import type { CiSetSettingsInput } from "./types/CiSetSettingsInput";

/**
 * Create a DynamoDB-backed settings store using a CloudIgniter DynamoDB adapter.
 *
 * @param input - Store creation input.
 * @returns DynamoDB-backed settings store.
 */
export function ciCreateDynamoSettingsStore(
  input: CiCreateDynamoSettingsStoreInput,
): CiSettingsStore {
  const {
    adapter,
    publicSettingsTableName,
    privateSettingsTableName,
    userSettingsTableName,
  } = input;

  const ciResolveTableName = (
    scope: CiGetSettingsRecordInput["scope"],
  ): string => {
    return ciResolveSettingsTableName({
      scope,
      publicSettingsTableName,
      privateSettingsTableName,
      userSettingsTableName,
    });
  };

  return {
    async getRecord<TSettings extends CiSettings = CiSettings>(
      recordInput: CiGetSettingsRecordInput,
    ): Promise<CiSettingsRecord<TSettings> | null> {
      const ciTableName = ciResolveTableName(recordInput.scope);
      const ciKeys = ciBuildSettingsKeys(recordInput);

      const ciItem = await adapter.getItem<TSettings>({
        tableName: ciTableName,
        key: {
          PK: ciKeys.PK,
          SK: ciKeys.SK,
        },
      });

      if (!ciItem) {
        return null;
      }

      return ciMapItemToSettingsRecord<TSettings>(ciItem);
    },

    async setRecord<TSettings extends CiSettings = CiSettings>(
      recordInput: CiSetSettingsInput<TSettings>,
    ): Promise<CiSettingsRecord<TSettings>> {
      const ciTableName = ciResolveTableName(recordInput.scope);
      const ciExistingRecord = await this.getRecord<TSettings>(recordInput);
      const ciNow = new Date().toISOString();

      const ciRecord: CiSettingsRecord<TSettings> = {
        settingsId: recordInput.settingsId,
        scope: recordInput.scope,
        targetTenantScope: recordInput.targetTenantScope,
        tenantId: recordInput.tenantId,
        userId: recordInput.userId,
        value: { ...recordInput.value },
        createdAt: ciExistingRecord?.createdAt ?? ciNow,
        updatedAt: ciNow,
      };

      const ciItem = ciMapSettingsRecordToItem(ciRecord);

      await adapter.putItem<TSettings>({
        tableName: ciTableName,
        item: ciItem,
      });

      return {
        ...ciRecord,
        value: { ...ciRecord.value },
      };
    },

    async deleteRecord(recordInput: CiDeleteSettingsInput): Promise<boolean> {
      const ciTableName = ciResolveTableName(recordInput.scope);
      const ciKeys = ciBuildSettingsKeys(recordInput);

      return adapter.deleteItem({
        tableName: ciTableName,
        key: {
          PK: ciKeys.PK,
          SK: ciKeys.SK,
        },
      });
    },
  };
}
