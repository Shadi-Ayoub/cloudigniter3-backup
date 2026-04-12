import type { CiDeleteSettingsInput } from "./CiDeleteSettingsInput";
import type { CiGetSettingsRecordInput } from "./CiGetSettingsRecordInput";
import type { CiSetSettingsInput } from "./CiSetSettingsInput";
import type { CiSettings, CiSettingsRecord } from "../../../";

/**
 * Low-level store contract for persisted settings records.
 *
 * This abstraction makes it easy to switch from an in-memory store
 * to DynamoDB later without changing the higher-level service contract.
 */
export type CiSettingsStore = {
  /**
   * Read a single persisted record.
   */
  getRecord: <TSettings extends CiSettings = CiSettings>(
    input: CiGetSettingsRecordInput,
  ) => Promise<CiSettingsRecord<TSettings> | null>;

  /**
   * Persist a single record.
   */
  setRecord: <TSettings extends CiSettings = CiSettings>(
    input: CiSetSettingsInput<TSettings>,
  ) => Promise<CiSettingsRecord<TSettings>>;

  /**
   * Delete a single record.
   */
  deleteRecord: (input: CiDeleteSettingsInput) => Promise<boolean>;
};
