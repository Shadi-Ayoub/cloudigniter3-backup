import type {
  CiGetSettingsRecordInput,
  CiSettingsStore,
} from "@cloudigniter/core/server";
import type { CiSettings } from "@cloudigniter/core";

/**
 * Read a single persisted settings record from a store.
 *
 * @param store - Settings store implementation.
 * @param input - Record lookup input.
 * @returns Matching persisted record, or `null`.
 */
export async function ciGetSettingsRecord<
  TSettings extends CiSettings = CiSettings,
>(store: CiSettingsStore, input: CiGetSettingsRecordInput) {
  return store.getRecord<TSettings>(input);
}
