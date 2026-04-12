import { Dynamodb } from '@cloudigniter/next/services/dynamodb/server';
import {
  ciError500,
  ciNormalizeThrownError,
  ciOk200,
  ciSerializeUnknownError,
  type CiResult,
} from '@cloudigniter/next/core';
import {
  ciWithDdbClient,
  type CiListOrgUnitsInterface,
  type CiOrgUnitCommonArgs,
  type CiSystemOrgUnitItem,
} from '@cloudigniter/next/core/server';

import { ciBuildOuPK } from '../helpers';

// - If parentPath provided → list subtree (begins_with PATH#<parentPath>).
// - Otherwise → list all OU for tenant.

/**
 * Lists organizational units for a tenant.
 *
 * Current behavior:
 * - Loads all OU items for the tenant.
 *
 * Notes:
 * - The current implementation does not yet apply `parentPath` filtering.
 */
export async function ciListOrgUnits(
  args: CiOrgUnitCommonArgs & { input: CiListOrgUnitsInterface }
): Promise<CiResult<CiSystemOrgUnitItem[]>> {
  const { tableName, clientConfig, input } = args;
  const { tenantId } = input;

  const ddb = new Dynamodb(clientConfig);

  try {
    return await ciWithDdbClient(ddb, async () => {
      const query = await ddb.queryItems<CiSystemOrgUnitItem>({
        TableName: tableName,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': ciBuildOuPK(tenantId),
        },
      });

      if (!query.ok) {
        return ciError500(
          query.body.error || 'ORG_UNIT_LIST: Failed to query organizational units.',
          query.body.details
        );
      }

      return ciOk200(query.body.items);
    });
  } catch (error) {
    const ciError = ciNormalizeThrownError(error);

    return ciError500(
      ciError.message || 'ORG_UNIT_LIST: Unexpected error while listing organizational units.',
      ciSerializeUnknownError(error)
    );
  } finally {
    ddb.destroy();
  }
}
