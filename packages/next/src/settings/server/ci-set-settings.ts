import type { CiSettings } from '../common/types';
import type { CiSetSettingsInput } from './types';
import { ciCreateSettingsService } from './ci-create-settings-service';
import { ciCreateSettingsStore } from './ci-create-settings-store';

/**
 * Convenience helper that writes a persisted settings record using a fresh
 * in-memory store.
 *
 * @param input - Persisted record write request.
 * @returns Persisted settings record.
 */
export async function ciSetSettings<TSettings extends CiSettings = CiSettings>(
  input: CiSetSettingsInput<TSettings>,
) {
  const service = ciCreateSettingsService(ciCreateSettingsStore());
  return service.setRecord<TSettings>(input);
}
