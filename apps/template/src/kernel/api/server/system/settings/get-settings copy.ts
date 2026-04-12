import { cache } from 'react';
// import { cookies } from 'next/headers';
// import { getCurrentUser } from 'aws-amplify/auth/server';

import type {
  ApiAuthMode,
  // CiAmplifyOutputs,
  GetSettingsHandlerInterface,
  CiGraphQLResponse,
  CiRequest,
  ServerErrorPayload,
  Settings,
} from '@cloudigniter/next/types';
import { getErrorMessage } from '@cloudigniter/next/utility';
import {
  // getAmplifyServerContext,
  unwrapSettings,
} from '@cloudigniter/next/server';

import { client } from '@/kernel/api/server';
import { extendedSettingsDefaultValues } from '@/custom/settings';
import ciConfig from '@/../cloudigniter.config';
// import outputs from '@/../amplify_outputs.json';

/**
 * Fetches application settings from the backend API.
 *
 * This method is cached using React's `cache` function to prevent multiple
 * network requests for the same data within the same component hierarchy.
 * It dynamically handles both authenticated and unauthenticated (guest) users
 * by attempting to fetch the current user first and falling back to guest credentials
 * via public apiKey authentication if no authenticated user is found.
 *
 * @async
 * @returns {Promise<Settings>} A promise that resolves with the application settings.
 * @throws {Error} Throws an error with a JSON payload of type `ServerErrorPayload`
 *   if the API call fails or the settings cannot be unwrapped.
 */
export const getSettings = cache(
  async ({ authMode }: { authMode: ApiAuthMode }) => {
    try {
      const input: CiRequest<GetSettingsHandlerInterface> = {
        input: { extendedSettingsDefaultValues },
        options: {
          DynamoDbClientConfig: ciConfig.dynamodb.clientConfig,
        },
      };

      const inputString = JSON.stringify(input);
      const apiResponse: CiGraphQLResponse = await client.queries.getSettings(
        {
          inputString,
        },
        { authMode } // <- 'userPool' for signed-in, 'apikey' for guests
      );
      // throw Error(JSON.stringify(apiResponse));
      const settings = unwrapSettings(apiResponse) as Settings;

      const keys = Object.keys(settings);
      const keysListString = keys.join('/');
      console.log(`Settings are loaded with keys ${keysListString}`);

      return settings;
    } catch (error: unknown) {
      throw new Error(
        JSON.stringify({
          title: 'Settings fetch failed',
          message: `Failed to get the settings! ${getErrorMessage(error)}`,
          // message: `Failed to get the settings! ${JSON.stringify(error)}`,
          severity: 'critical',
          showRetry: true,
        } as ServerErrorPayload)
      );
    }
  }
);
