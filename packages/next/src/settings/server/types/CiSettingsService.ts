import type { CiResolvedSettingsResult } from "../../common/types/CiResolvedSettingsResult";
import type { CiSettings } from "../../common/types/CiSettings";
import type { CiSettingsRecord } from "../../common/types/CiSettingsRecord";
import type { CiDeleteSettingsInput } from "./CiDeleteSettingsInput";
import type { CiGetResolvedSettingsInput } from "./CiGetResolvedSettingsInput";
import type { CiGetSettingsRecordInput } from "./CiGetSettingsRecordInput";
import type { CiSetSettingsInput } from "./CiSetSettingsInput";

/**
 * High-level settings service contract.
 */
export type CiSettingsService = {
  /**
   * Resolve the final merged settings object.
   */
  getResolved: <TSettings extends CiSettings = CiSettings>(
    input: CiGetResolvedSettingsInput,
  ) => Promise<CiResolvedSettingsResult<TSettings>>;

  /**
   * Read one persisted record.
   */
  getRecord: <TSettings extends CiSettings = CiSettings>(
    input: CiGetSettingsRecordInput,
  ) => Promise<CiSettingsRecord<TSettings> | null>;

  /**
   * Persist one record.
   */
  setRecord: <TSettings extends CiSettings = CiSettings>(
    input: CiSetSettingsInput<TSettings>,
  ) => Promise<CiSettingsRecord<TSettings>>;

  /**
   * Delete one persisted record.
   */
  deleteRecord: (input: CiDeleteSettingsInput) => Promise<boolean>;
};
