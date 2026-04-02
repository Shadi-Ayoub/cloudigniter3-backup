import type { CiResolvedSettingsResult } from '../../common/types/CiResolvedSettingsResult';
import type { CiSettingsRecord } from '../../common/types/CiSettingsRecord';
import type { CiSettings } from '../../common/types/CiSettings';
import type { CiDeleteSettingsInput } from './CiDeleteSettingsInput';
import type { CiGetResolvedSettingsInput } from './CiGetResolvedSettingsInput';
import type { CiGetSettingsRecordInput } from './CiGetSettingsRecordInput';
import type { CiSetSettingsInput } from './CiSetSettingsInput';

/**
 * Settings service contract.
 */
export type CiSettingsService = {
  getResolved: <TSettings extends CiSettings = CiSettings>(
    input: CiGetResolvedSettingsInput,
  ) => Promise<CiResolvedSettingsResult<TSettings>>;
  getRecord: <TSettings extends CiSettings = CiSettings>(
    input: CiGetSettingsRecordInput,
  ) => Promise<CiSettingsRecord<TSettings> | null>;
  setRecord: <TSettings extends CiSettings = CiSettings>(
    input: CiSetSettingsInput<TSettings>,
  ) => Promise<CiSettingsRecord<TSettings>>;
  deleteRecord: (input: CiDeleteSettingsInput) => Promise<boolean>;
};
