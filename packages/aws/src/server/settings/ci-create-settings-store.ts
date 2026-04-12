import type {
  CiDeleteSettingsInput,
  CiGetSettingsRecordInput,
  CiSettingsStore,
  CiSetSettingsInput,
} from "@cloudigniter/core/server";
import type { CiSettings, CiSettingsRecord } from "@cloudigniter/core";
import { ciBuildSettingsKeys } from "./ci-build-settings-keys";

/**
 * Create an in-memory settings store.
 *
 * This is the reference implementation for:
 * - local development
 * - unit tests
 * - API contract stabilization
 *
 * Later, a DynamoDB-backed implementation can replace this
 * without changing the surrounding service interface.
 *
 * @returns In-memory settings store.
 */
export function ciCreateSettingsStore(): CiSettingsStore {
  const records = new Map<string, CiSettingsRecord>();

  const ciBuildMapKey = (input: CiGetSettingsRecordInput): string => {
    const keys = ciBuildSettingsKeys(input);
    return `${keys.PK}::${keys.SK}`;
  };

  return {
    async getRecord<TSettings extends CiSettings = CiSettings>(
      input: CiGetSettingsRecordInput,
    ): Promise<CiSettingsRecord<TSettings> | null> {
      const hit = records.get(ciBuildMapKey(input));

      if (!hit) {
        return null;
      }

      return {
        ...hit,
        value: { ...hit.value },
      } as CiSettingsRecord<TSettings>;
    },

    async setRecord<TSettings extends CiSettings = CiSettings>(
      input: CiSetSettingsInput<TSettings>,
    ): Promise<CiSettingsRecord<TSettings>> {
      const existing = records.get(ciBuildMapKey(input));
      const now = new Date().toISOString();

      const record: CiSettingsRecord<TSettings> = {
        settingsId: input.settingsId,
        scope: input.scope,
        targetTenantScope: input.targetTenantScope,
        tenantId: input.tenantId,
        userId: input.userId,
        value: { ...input.value },
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      records.set(ciBuildMapKey(input), record as CiSettingsRecord);

      return {
        ...record,
        value: { ...record.value },
      };
    },

    async deleteRecord(input: CiDeleteSettingsInput): Promise<boolean> {
      return records.delete(ciBuildMapKey(input));
    },
  };
}
