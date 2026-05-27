import { deepmerge } from 'deepmerge-ts';

import {
  CI_DATA_RESOURCE_MODULES,
  type CiCoreFunctionId,
  type CiCoreTables,
  type CiResourceEnvKeyAllowlist,
} from '@cloudigniter/next/server/backend';

import { ciPickEnvKeyAllowlistForFunctions } from './ci-pick-env-key-allowlist-for-functions';
import type { CiBackend } from './types';

export const ciGetDataStack = (backend: CiBackend) => {
  const tbls = backend.data.resources.tables;

  const tables: CiCoreTables = {
    privateSettingsTable: {
      name: tbls.PrivateSettings.tableName,
      arn: tbls.PrivateSettings.tableArn,
    },
    publicSettingsTable: {
      name: tbls.PublicSettings.tableName,
      arn: tbls.PublicSettings.tableArn,
    },
    systemTable: {
      name: tbls.System.tableName,
      arn: tbls.System.tableArn,
    },
    userProfileTable: {
      name: tbls.UserProfile.tableName,
      arn: tbls.UserProfile.tableArn,
    },
    userSettingsTable: {
      name: tbls.UserSettings.tableName,
      arn: tbls.UserSettings.tableArn,
    },
  };

  const tableArns = {
    privateSettingsTable: tbls.PrivateSettings.tableArn,
    publicSettingsTable: tbls.PublicSettings.tableArn,
    systemTable: tbls.System.tableArn,
    userProfileTable: tbls.UserProfile.tableArn,
    userSettingsTable: tbls.UserSettings.tableArn,
  };

  const functions = {
    ciGetSettingsHandler: backend.getSettingsHandler.resources.lambda,
    ciSetSettingsHandler: backend.setSettingsHandler.resources.lambda,

    ciCreateTenantHandler: backend.createTenantHandler.resources.lambda,
    ciGetTenantHandler: backend.getTenantHandler.resources.lambda,
    ciDeleteTenantHandler: backend.deleteTenantHandler.resources.lambda,
    ciListTenantsHandler: backend.listTenantsHandler.resources.lambda,
    ciUpdateTenantHandler: backend.updateTenantHandler.resources.lambda,
    ciSeedTenantsHandler: backend.seedTenantsHandler.resources.lambda,

    // Add these only if they exist in your backend:
    // ciClearSeederHandler: backend.clearSeederHandler.resources.lambda,
    // ciGetTenantBySlugHandler: backend.getTenantBySlugHandler.resources.lambda,
    // ciGetTenantLookupBySlugHandler: backend.getTenantLookupBySlugHandler.resources.lambda,

    // Add these only if they exist in your backend:
    // createUserProfileHandler: backend.createUserProfileHandler.resources.lambda,
    // getUserProfileHandler: backend.getUserProfileHandler.resources.lambda,
    // updateUserProfileHandler: backend.updateUserProfileHandler.resources.lambda,
    // deleteUserProfileHandler: backend.deleteUserProfileHandler.resources.lambda,
  };

  const mergedEnvKeyAllowlist =
    CI_DATA_RESOURCE_MODULES.reduce<CiResourceEnvKeyAllowlist>(
      (acc, module) => deepmerge(acc, module.envKeyAllowlist),
      {}
    );

  const packageDataHandlerIds = Array.from(
    new Set(CI_DATA_RESOURCE_MODULES.flatMap((module) => module.handlers))
  ) as readonly CiCoreFunctionId[];

  const CI_DATA_FUNCS_IDS = packageDataHandlerIds.filter(
    (fnId): fnId is keyof typeof functions & CiCoreFunctionId =>
      fnId in functions
  );

  const envKeyAllowlist = ciPickEnvKeyAllowlistForFunctions(
    mergedEnvKeyAllowlist,
    functions
  );

  return {
    tables,
    tableArns,
    functions,
    CI_DATA_FUNCS_IDS,
    envKeyAllowlist,
  };
};
