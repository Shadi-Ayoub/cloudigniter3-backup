import type { CiNextCoreConfig } from "@cloudigniter/next/types";
import type { CiAmplifyOutputs } from "@cloudigniter/aws/types";

import outputs from "@/../amplify_outputs.json";
import config from "@/../cloudigniter.config";

const amplifyOutputs = outputs as CiAmplifyOutputs;

/**
 * Returns configuration that is safe to use inside Proxy.
 *
 * This function must not call request-scoped APIs such as:
 * getLocale(), getMessages(), headers(), or cookies().
 */
export function appGetCoreConfig(): CiNextCoreConfig {
  const appCoreConfig = config as CiNextCoreConfig;

  return {
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
}
