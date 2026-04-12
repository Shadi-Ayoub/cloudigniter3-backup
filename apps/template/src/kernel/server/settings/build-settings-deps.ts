import { ciCreateSettingsDepsDdb } from '@cloudigniter/next/server';
import type {
  SettingsServiceDeps,
  DdbSettingsStoreConfig,
} from '@cloudigniter/next/types';

import { ciBuildSettingsRegistry } from '@/custom/settings/settings-registry';

/**
 * Create the settings dependencies for server-side execution.
 * - Uses DynamoDB stores (your wrapper) via the package wiring.
 * - No Amplify Data client is passed.
 */
export function buildSettingsDeps(): SettingsServiceDeps {
  const registry = ciBuildSettingsRegistry();

  // You can resolve these from env, amplify outputs, etc.
  // Keeping them explicit here as a template.
  const ddb: DdbSettingsStoreConfig = {
    clientConfig: { region: process.env.AWS_REGION ?? 'us-east-1' },
    tables: {
      publicSettingTableName: process.env.CI_PUBLIC_SETTINGS_TABLE_NAME ?? '',
      privateSettingsTableName:
        process.env.CI_PRIVATE_SETTINGS_TABLE_NAME ?? '',
      userSettingTableName: process.env.CI_USER_SETTINGS_TABLE_NAME ?? '',
    },
    systemTenantId: process.env.CI_SYSTEM_TENANT_ID ?? 'global',
  };

  return ciCreateSettingsDepsDdb({ registry, ddb });
}
