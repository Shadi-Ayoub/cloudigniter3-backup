import type {
  CiSettings,
  CiSettingsRecord,
  CiSettingsScope,
  CiSettingsService,
  CiTargetTenantScope,
} from "@cloudigniter/core/types";

export type CiInitializeSettingsIfMissingInput<
  TSettings extends CiSettings = CiSettings,
> = {
  service: CiSettingsService;
  settingsId: string;
  scope: CiSettingsScope;
  targetTenantScope: CiTargetTenantScope;
  tenantId?: string;
  userId?: string;
  value: Partial<TSettings>;
};

export type CiInitializeSettingsIfMissingResult<
  TSettings extends CiSettings = CiSettings,
> =
  | {
      initialized: false;
      record: CiSettingsRecord<TSettings>;
    }
  | {
      initialized: true;
      record: CiSettingsRecord<TSettings>;
    };

export async function ciInitializeSettingsIfMissing<
  TSettings extends CiSettings = CiSettings,
>(
  input: CiInitializeSettingsIfMissingInput<TSettings>,
): Promise<CiInitializeSettingsIfMissingResult<TSettings>> {
  const existing = await input.service.get<TSettings>({
    settingsId: input.settingsId,
    tenantId: input.tenantId,
    userId: input.userId,
  });

  const layer =
    input.targetTenantScope === "system"
      ? existing.layers.system
      : input.targetTenantScope === "global"
      ? existing.layers.global
      : input.targetTenantScope === "tenant" && input.scope === "user"
      ? existing.layers.user
      : existing.layers.tenant;

  if (layer) {
    return {
      initialized: false,
      record: layer,
    };
  }

  const record = await input.service.set<TSettings>({
    settingsId: input.settingsId,
    scope: input.scope,
    targetTenantScope: input.targetTenantScope,
    tenantId: input.tenantId,
    userId: input.userId,
    value: input.value,
  });

  return {
    initialized: true,
    record,
  };
}
