import { type CoreTables } from '@cloudigniter/next/server';

import type { Backend } from './types';

/**
 * Define Core Tables
 */

export const getTables = (backend: Backend) => {
  const systemTable = backend.data.resources.tables.System;
  const userProfileTable = backend.data.resources.tables.UserProfile;

  const tables: CoreTables = {
    system: { name: systemTable.tableName, arn: systemTable.tableArn },
    userProfile: {
      name: userProfileTable.tableName,
      arn: userProfileTable.tableArn,
    },
  };

  return tables;
};
