import type { CiSettings, CiSettingsRecord } from '../common/types';
import { ciBuildSettingsKeys } from './ci-build-settings-keys';
import type {
  CiDeleteSettingsInput,
  CiGetSettingsRecordInput,
  CiSetSettingsInput,
  CiSettingsStore,
} from './types';

/**
 * Create an in-memory settings store.
 *
 * This reference implementation is useful for local development, tests, and as
 * the baseline contract for future database-backed store implementations.
 *
 * @returns In-memory settings store.
 */
export function ciCreateSettingsStore(): CiSettingsStore {
  const records = new Map<string, CiSettingsRecord>();

  const buildMapKey = (input: CiGetSettingsRecordInput): string => {
    const keys = ciBuildSettingsKeys(input);
    return `${keys.PK}::${keys.SK}`;
  };

  return {
    async getRecord<TSettings extends CiSettings = CiSettings>(
      input: CiGetSettingsRecordInput,
    ): Promise<CiSettingsRecord<TSettings> | null> {
      const hit = records.get(buildMapKey(input));
      return (hit ? ({ ...hit, value: { ...hit.value } } as CiSettingsRecord<TSettings>) : null);
    },

    async setRecord<TSettings extends CiSettings = CiSettings>(
      input: CiSetSettingsInput<TSettings>,
    ): Promise<CiSettingsRecord<TSettings>> {
      const existing = records.get(buildMapKey(input));
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

      records.set(buildMapKey(input), record as CiSettingsRecord);
      return { ...record, value: { ...record.value } };
    },

    async deleteRecord(input: CiDeleteSettingsInput): Promise<boolean> {
      return records.delete(buildMapKey(input));
    },
  };
}
