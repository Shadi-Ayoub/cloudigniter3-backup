import type { Context } from 'aws-lambda';

import { ciBuildSettingsServiceDeps, ciGetSettingsService } from '@CI/server/services/settings';
import {
  ciAttachDebug,
  ciNormalizeThrownError,
  ciResponseError,
  ciResponseOk,
  safeParseRequest,
} from '@CI/utility/server';
import type {
  CiGetSettingsHandlerInput,
  CiLambdaEvent,
  CiResponse,
  CiRequest,
  CiSettingsServiceDepsInput,
} from '@CI/types';

export async function ciGetSettingsHandler(event: CiLambdaEvent, context: Context): Promise<CiResponse> {
  const ciEnvVars = [
    'CI_PUBLIC_SETTINGS_TABLE_NAME',
    'CI_PRIVATE_SETTINGS_TABLE_NAME',
    'CI_USER_SETTINGS_TABLE_NAME',
    'CI_REGION',
    'CI_ENV_MODE',
  ];

  try {
    const ciRequest = safeParseRequest<CiGetSettingsHandlerInput>(event.arguments.inputString) as
      | CiRequest<CiGetSettingsHandlerInput>
      | undefined;

    if (!ciRequest?.input) {
      return ciAttachDebug(
        await ciResponseError(
          400,
          'GET_SETTINGS_HANDLER: inputString must be a valid CiRequest<CiGetSettingsHandlerInput>.',
          {
            extras: {
              message: 'inputString must be a valid CiRequest<CiGetSettingsHandlerInput>.',
              parameter: event.arguments.inputString,
            },
          }
        ),
        event,
        context,
        ciEnvVars
      );
    }

    const { input } = ciRequest;

    if (!process.env.CI_PUBLIC_SETTINGS_TABLE_NAME) {
      return ciAttachDebug(
        await ciResponseError(400, 'GET_SETTINGS_HANDLER: CI_PUBLIC_SETTINGS_TABLE_NAME is not defined.', {
          extras: {
            message: 'CI_PUBLIC_SETTINGS_TABLE_NAME is not defined.',
            parameter: event.arguments.inputString,
          },
        }),
        event,
        context,
        ciEnvVars
      );
    }

    if (!process.env.CI_PRIVATE_SETTINGS_TABLE_NAME) {
      return ciAttachDebug(
        await ciResponseError(400, 'GET_SETTINGS_HANDLER: CI_PRIVATE_SETTINGS_TABLE_NAME is not defined.', {
          extras: {
            message: 'CI_PRIVATE_SETTINGS_TABLE_NAME is not defined.',
            parameter: event.arguments.inputString,
          },
        }),
        event,
        context,
        ciEnvVars
      );
    }

    if (!process.env.CI_USER_SETTINGS_TABLE_NAME) {
      return ciAttachDebug(
        await ciResponseError(400, 'GET_SETTINGS_HANDLER: CI_USER_SETTINGS_TABLE_NAME is not defined.', {
          extras: {
            message: 'CI_USER_SETTINGS_TABLE_NAME is not defined.',
            parameter: event.arguments.inputString,
          },
        }),
        event,
        context,
        ciEnvVars
      );
    }

    if (!process.env.CI_REGION) {
      return ciAttachDebug(
        await ciResponseError(400, 'GET_SETTINGS_HANDLER: CI_REGION is not defined.', {
          extras: {
            message: 'CI_REGION is not defined.',
            parameter: event.arguments.inputString,
          },
        }),
        event,
        context,
        ciEnvVars
      );
    }

    const ciDepsInput: CiSettingsServiceDepsInput = {
      registry: input.registry,
      dynamoDbClientConfig: {
        region: process.env.CI_REGION,
      },
      publicTableName: process.env.CI_PUBLIC_SETTINGS_TABLE_NAME,
      privateTableName: process.env.CI_PRIVATE_SETTINGS_TABLE_NAME,
      userTableName: process.env.CI_USER_SETTINGS_TABLE_NAME,
    };

    const ciDepsResult = ciBuildSettingsServiceDeps(ciDepsInput);

    if (!ciDepsResult.ok) {
      return ciAttachDebug(
        await ciResponseError(400, ciDepsResult.body.error, {
          extras: {
            message: ciDepsResult.body.error,
            parameter: event.arguments.inputString,
          },
          details: ciDepsResult.body.details,
        }),
        event,
        context,
        ciEnvVars
      );
    }

    const ciResult = await ciGetSettingsService({
      settingsServiceDeps: ciDepsResult.body,
      tenantId: input.tenantId,
      userId: input.userId,
      publicSettingIds: input.publicSettingIds,
      privateSettingIds: input.privateSettingIds,
      userSettingIds: input.userSettingIds,
      pathname: input.pathname,
      routeSettingIds: input.routeSettingIds,
    });

    if (!ciResult.ok) {
      return ciAttachDebug(
        await ciResponseError(ciResult.statusCode, ciResult.body.error, {
          extras: {
            message: ciResult.body.error,
            parameter: event.arguments.inputString,
          },
          details: ciResult.body.details,
        }),
        event,
        context,
        ciEnvVars
      );
    }

    return ciAttachDebug(await ciResponseOk(ciResult.body), event, context, ciEnvVars);
  } catch (error) {
    const ciError = ciNormalizeThrownError(error);

    return ciAttachDebug(
      await ciResponseError(400, `GET_SETTINGS_HANDLER: ${ciError.message}`, {
        extras: {
          message: ciError.message,
          parameter: event.arguments.inputString,
        },
      }),
      event,
      context,
      ciEnvVars
    );
  }
}
