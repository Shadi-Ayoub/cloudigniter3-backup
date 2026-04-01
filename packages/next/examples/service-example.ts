import { ciCreateSettingsService } from '../packages/next/src/settings/server/ci-create-settings-service';
import { ciCreateSettingsStore } from '../packages/next/src/settings/server/ci-create-settings-store';
import { ciSettingsRegistry } from './registry-example';

/**
 * Example service usage.
 */
async function main() {
  const store = ciCreateSettingsStore();
  const service = ciCreateSettingsService(store);

  await service.setRecord({
    settingsId: 'core',
    scope: 'public',
    targetTenantScope: 'global',
    value: {
      applicationName: 'CloudIgniter Platform',
    },
  });

  const resolved = await service.getResolved({
    registry: ciSettingsRegistry,
    settingsId: 'core',
    scope: 'public',
  });

  console.log(resolved.value.applicationName);
}

void main();
