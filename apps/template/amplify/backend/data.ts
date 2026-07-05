import { deepmerge } from "deepmerge-ts";

import {
  CI_DATA_RESOURCE_MODULES,
  type CiCoreFunctionId,
  type CiCoreTables,
  type CiResourceEnvKeyAllowlist,
} from "@cloudigniter/aws/server/backend";

import { ciPickEnvKeyAllowlistForFunctions } from "./ci-pick-env-key-allowlist-for-functions";
import type { CiBackend } from "./types";

function ciRequireDataTable<T>(
  table: T | undefined,
  tableId: string,
): NonNullable<T> {
  if (!table) {
    throw new Error(
      `[ciGetDataStack] Required Amplify data table "${tableId}" is not defined.`,
    );
  }

  return table;
}

export const ciGetDataStack = (backend: CiBackend) => {
  const tbls = backend.data.resources.tables;

  // const privateSettingsTable = ciRequireDataTable(
  //   tbls.PrivateSettings,
  //   "PrivateSettings",
  // );
  // const publicSettingsTable = ciRequireDataTable(
  //   tbls.PublicSettings,
  //   "PublicSettings",
  // );
  // const systemTable = ciRequireDataTable(tbls.System, "System");
  const userProfileTable = ciRequireDataTable(tbls.UserProfile, "UserProfile");
  // const userSettingsTable = ciRequireDataTable(
  //   tbls.UserSettings,
  //   "UserSettings",
  // );

  const tables: CiCoreTables = {
    // privateSettingsTable: {
    //   name: privateSettingsTable.tableName,
    //   arn: privateSettingsTable.tableArn,
    // },
    // publicSettingsTable: {
    //   name: publicSettingsTable.tableName,
    //   arn: publicSettingsTable.tableArn,
    // },
    // systemTable: {
    //   name: systemTable.tableName,
    //   arn: systemTable.tableArn,
    // },
    userProfileTable: {
      name: userProfileTable.tableName,
      arn: userProfileTable.tableArn,
    },
    // userSettingsTable: {
    //   name: userSettingsTable.tableName,
    //   arn: userSettingsTable.tableArn,
    // },
  };

  const tableArns = {
    // privateSettingsTable: privateSettingsTable.tableArn,
    // publicSettingsTable: publicSettingsTable.tableArn,
    // systemTable: systemTable.tableArn,
    userProfileTable: userProfileTable.tableArn,
    // userSettingsTable: userSettingsTable.tableArn,
  };

  const functions = {
    // ciGetSettingsHandler: backend.getSettingsHandler.resources.lambda,
    // ciSetSettingsHandler: backend.setSettingsHandler.resources.lambda,
    // ciCreateTenantHandler: backend.createTenantHandler.resources.lambda,
    // ciGetTenantHandler: backend.getTenantHandler.resources.lambda,
    // ciDeleteTenantHandler: backend.deleteTenantHandler.resources.lambda,
    // ciListTenantsHandler: backend.listTenantsHandler.resources.lambda,
    // ciUpdateTenantHandler: backend.updateTenantHandler.resources.lambda,
    // ciSeedTenantsHandler: backend.seedTenantsHandler.resources.lambda,
    // Add these only if they exist in your backend:
    // ciClearSeederHandler: backend.clearSeederHandler.resources.lambda,
    // ciGetTenantBySlugHandler: backend.getTenantLookupBySlugHandler.resources.lambda,
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
      {},
    );

  const packageDataHandlerIds = Array.from(
    new Set(CI_DATA_RESOURCE_MODULES.flatMap((module) => module.handlers)),
  ) as readonly CiCoreFunctionId[];

  const CI_DATA_FUNCS_IDS = packageDataHandlerIds.filter(
    (fnId): fnId is keyof typeof functions & CiCoreFunctionId =>
      fnId in functions,
  );

  const envKeyAllowlist = ciPickEnvKeyAllowlistForFunctions(
    mergedEnvKeyAllowlist,
    functions,
  );

  return {
    tables,
    tableArns,
    functions,
    CI_DATA_FUNCS_IDS,
    envKeyAllowlist,
  };
};
