import type { CiSettingsRecord } from '../../common/types/CiSettingsRecord';
import type { CiSettings } from '../../common/types/CiSettings';
import type { CiDeleteSettingsInput } from './CiDeleteSettingsInput';
import type { CiGetSettingsRecordInput } from './CiGetSettingsRecordInput';
import type { CiSetSettingsInput } from './CiSetSettingsInput';

/**
 * Low-level server store contract.
 */
export type CiSettingsStore = {
  getRecord: <TSettings extends CiSettings = CiSettings>(
    input: CiGetSettingsRecordInput,
  ) => Promise<CiSettingsRecord<TSettings> | null>;
  setRecord: <TSettings extends CiSettings = CiSettings>(
    input: CiSetSettingsInput<TSettings>,
  ) => Promise<CiSettingsRecord<TSettings>>;
  deleteRecord: (input: CiDeleteSettingsInput) => Promise<boolean>;
};
