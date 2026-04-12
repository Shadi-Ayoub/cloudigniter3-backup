import type { CiSettingsTableItem } from "@cloudigniter/core/server";
import type { CiSettings, CiSettingsRecord } from "@cloudigniter/core";
import { ciBuildSettingsKeys } from "./ci-build-settings-keys";

/**
 * Map a settings record into a DynamoDB table item.
 *
 * @param record - Source settings record.
 * @returns DynamoDB item.
 */
export function ciMapSettingsRecordToItem<
  TSettings extends CiSettings = CiSettings,
>(record: CiSettingsRecord<TSettings>): CiSettingsTableItem<TSettings> {
  const ciKeys = ciBuildSettingsKeys({
    settingsId: record.settingsId,
    scope: record.scope,
    targetTenantScope: record.targetTenantScope,
    tenantId: record.tenantId,
    userId: record.userId,
  });

  return {
    PK: ciKeys.PK,
    SK: ciKeys.SK,
    type: "settings",
    settingsId: record.settingsId,
    scope: record.scope,
    targetTenantScope: record.targetTenantScope,
    tenantId: record.tenantId,
    userId: record.userId,
    value: { ...record.value },
    createdAt: record.createdAt ?? new Date().toISOString(),
    updatedAt: record.updatedAt ?? new Date().toISOString(),
  };
}
