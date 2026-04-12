import type { TenantSettingsRepository } from '@CI/server/settings/tenant_settings_repository';
import type {
  SettingsRecordView,
  SettingsVisibility,
} from '@CI/server/settings/types';

import type { AmplifyModelFacade } from './amplify-model-facade-types';
import type {
  TenantSettingsCreateInput,
  TenantSettingsItem,
  TenantSettingsPrimaryKey,
} from './amplify-tenant-settings-shapes';

type TenantSettingsModelsFacade = {
  publicSettings: AmplifyModelFacade<
    TenantSettingsItem,
    TenantSettingsPrimaryKey,
    TenantSettingsCreateInput
  >;
  privateSettings: AmplifyModelFacade<
    TenantSettingsItem,
    TenantSettingsPrimaryKey,
    TenantSettingsCreateInput
  >;
};

function assert_no_errors(errors?: { message: string }[] | null): void {
  if (errors && errors.length)
    throw new Error(errors.map((e) => e.message).join('; '));
}

function to_record_view(item: TenantSettingsItem): SettingsRecordView {
  return {
    tenantId: item.tenantId,
    key: item.key,
    data: item.data ?? {},

    status: item.status ?? null,
    version: item.version ?? null,
    createdAt: item.createdAt ?? null,
    updatedAt: item.updatedAt ?? null,
  };
}

function model_for(
  models: TenantSettingsModelsFacade,
  visibility: SettingsVisibility
) {
  return visibility === 'public'
    ? models.publicSettings
    : models.privateSettings;
}

/**
 * App-side adapter to satisfy the package TenantSettingsRepository contract.
 * Uses plural naming: publicSettings/privateSettings.
 */
export function create_amplify_tenant_settings_repo(
  models: TenantSettingsModelsFacade
): TenantSettingsRepository {
  return {
    async getTenantSettingsRecord({ visibility, tenantId, key }) {
      const model = model_for(models, visibility);
      const res = await model.get({ tenantId, key });
      assert_no_errors(res.errors);
      return res.data ? to_record_view(res.data) : null;
    },

    async listTenantSettingsKeys({ visibility, tenantId }) {
      const model = model_for(models, visibility);
      const keys = new Set<string>();

      let nextToken: string | null | undefined = null;
      do {
        const page = await model.list({
          filter: { tenantId: { eq: tenantId } },
          limit: 1000,
          nextToken,
        });
        assert_no_errors(page.errors);

        for (const item of page.data ?? []) keys.add(String(item.key));
        nextToken = page.nextToken ?? null;
      } while (nextToken);

      return Array.from(keys);
    },

    async createTenantSettingsRecord({ visibility, record }) {
      const model = model_for(models, visibility);
      const res = await model.create({
        tenantId: record.tenantId,
        key: record.key,
        status: record.status ?? 'active',
        version: record.version ?? 1,
        data: record.data ?? {},
      });
      assert_no_errors(res.errors);
      return to_record_view(res.data);
    },
  };
}
