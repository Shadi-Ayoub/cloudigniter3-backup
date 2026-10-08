import { z } from 'zod';

export const extendedSettingsZodSchema = z.object({});

export type ExtendedSettingsFormValues = z.infer<
  typeof extendedSettingsZodSchema
>;
