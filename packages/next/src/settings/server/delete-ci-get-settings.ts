import type { CiSettings } from '../common/types';
import type { CiGetResolvedSettingsInput } from './types';
import { ciCreateSettingsService } from './ci-create-settings-service';
import { ciCreateSettingsStore } from './ci-create-settings-store';

/**
 * Convenience helper that resolves settings using a fresh in-memory service.
 *
 * In production you will usually create a long-lived service over a persistent
 * store and call `service.getResolved(...)` directly.
 *
 * @param input - Resolved settings request.
 * @returns Resolved settings result.
 */
export async function ciGetSettings<TSettings extends CiSettings = CiSettings>(
  input: CiGetResolvedSettingsInput,
) {
  const service = ciCreateSettingsService(ciCreateSettingsStore());
  return service.getResolved<TSettings>(input);
}
