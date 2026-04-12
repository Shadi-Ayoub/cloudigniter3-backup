import { z } from 'zod';

import type { CiSettingsFormExtendedTab } from './CiSettingsFormExtendedTab';
// import { type BaseSettingsFormValues } from './schemas';
import type { CiSettings } from '../../../common/types';

export type CiSettingsFormProps<T extends z.ZodRawShape = {}> = {
  input: {
    settings: CiSettings;
    direction: 'ltr' | 'rtl';
    submitUrl?: string;
    extendedZodSchema?: z.ZodObject<T>;
    // values?: z.infer<z.ZodObject<T>> & Partial<BaseSettingsFormValues>;
    extendedTabs?: CiSettingsFormExtendedTab[];
  };
};
