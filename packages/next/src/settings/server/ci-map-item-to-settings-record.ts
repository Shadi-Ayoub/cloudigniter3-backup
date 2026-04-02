import type { CiSettings } from "../common/types/CiSettings";
import type { CiSettingsRecord } from "../common/types/CiSettingsRecord";
import type { CiSettingsTableItem } from "./types/CiSettingsTableItem";

/**
 * Map a DynamoDB item into a settings record.
 *
 * @param item - Source DynamoDB item.
 * @returns Settings record.
 */
export function ciMapItemToSettingsRecord<
  TSettings extends CiSettings = CiSettings,
>(item: CiSettingsTableItem<TSettings>): CiSettingsRecord<TSettings> {
  return {
    settingsId: item.settingsId,
    scope: item.scope,
    targetTenantScope: item.targetTenantScope,
    tenantId: item.tenantId,
    userId: item.userId,
    value: { ...item.value },
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}
