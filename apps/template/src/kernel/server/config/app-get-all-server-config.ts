import { getMessages } from "next-intl/server";
import { getLocale } from "next-intl/server";
import { ciGetLangDir } from "@cloudigniter/core/lib";
import type { CiNextConfig, CiNextCoreConfig } from "@cloudigniter/next/types";
import type { CiAmplifyOutputs } from "@cloudigniter/aws/types";

import { appThemeProviderProps } from "@/custom/theme";
import outputs from "@/../amplify_outputs.json";
import config from "@/../cloudigniter.config";

const amplifyOutputs = outputs as CiAmplifyOutputs;

/**
 * This function should be called by the root layout.
 *
 * Returns the current system configurations, which include:
 * 1) Cloudigniter core configurations hosted in the root cloudigniter.config.ts file.
 * 2) Cloudigniter's resolved core configurations, which include the Locale & Direction.
 * 3) Cloudigniter's Next.js application resolved internationalization messages & Theme Provider props.
 * 5) Cloudigniters's Next.js application cloud providers configurations.
 *
 * @returns
 */
export const appGetAllServerConfig = async () => {
  let appCoreConfig = config as CiNextCoreConfig;

  appCoreConfig = {
    ...appCoreConfig,
    providers: {
      ...appCoreConfig.providers,
      aws: {
        ...appCoreConfig.providers?.aws,
        amplify: {
          ...appCoreConfig.providers?.aws?.amplify,
          amplifyOutputs,
        },
      },
    },
  };

  const messages = await getMessages(); // see /i18n/request.ts
  const locale = await getLocale();
  const direction = ciGetLangDir(locale);
  const languageDiagnosticsEndpoint = "/ci-internal/language";

  const appResolvedCoreConfig = {
    locale,
    direction,
    languageDiagnosticsEndpoint,
  };

  const routerMode = config.app.routerMode;
  const version = config.app.version;

  const appNextResolvedConfig = {
    version,
    routerMode,
    messages,
    appThemeProviderProps,
  };

  const extendedConfig = {
    appCoreConfig,
    appResolvedCoreConfig,
    appNextResolvedConfig,
  } as CiNextConfig;

  return extendedConfig;
};
