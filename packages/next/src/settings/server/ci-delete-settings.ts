import type { CiDeleteSettingsInput } from './types';
import { ciCreateSettingsService } from './ci-create-settings-service';
import { ciCreateSettingsStore } from './ci-create-settings-store';

/**
 * Convenience helper that deletes a persisted settings record using a fresh
 * in-memory store.
 *
 * @param input - Persisted record deletion request.
 * @returns Whether a record was removed.
 */
export async function ciDeleteSettings(input: CiDeleteSettingsInput) {
  const service = ciCreateSettingsService(ciCreateSettingsStore());
  return service.deleteRecord(input);
}
