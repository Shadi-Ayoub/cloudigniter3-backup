import { getMessages } from "next-intl/server";
import { getLocale } from "next-intl/server";

import type { CiAmplifyOutputs } from "@cloudigniter/aws";

import type { CiNextAwsResolvedConfig } from "./types";

// import { authenticatorProps } from '@/custom/authenticator/authenticator-props';
// import authenticatorStyleTheme from '@/custom/authenticator/authenticatorStyleTheme';
import { themeProviderProps } from "@/custom/theme";
import { getLangDir } from "@cloudigniter/next/utility";
import outputs from "@/../amplify_outputs.json";
import config from "@/../cloudigniter.config";

const amplifyOutputs = outputs as CiAmplifyOutputs;

/**
 * This function should be called by the root layout.
 *
 * Returns the current system configurations, which include:
 * 1) Cloudigniter settings in the root JSON file.
 * 2) Currently selected Locale
 * 3) Resolved locale Direction
 * 4) Currently loaded internationalization messages
 * 5) Amplify Outputs
 * 6) Next.js Theme Provider props
 *
 * @returns
 */
export const ciGetSystemConfig = async () => {
  const messages = await getMessages(); // see /i18n/request.ts
  const locale = await getLocale();
  const direction = getLangDir(locale);

  const extendedConfig = {
    ...config,
    locale,
    direction,
    messages,
    amplifyOutputs,
    // authenticatorProps,
    // authenticatorStyleTheme,
    themeProviderProps,
  } as CiNextAwsResolvedConfig;

  return extendedConfig;
};
