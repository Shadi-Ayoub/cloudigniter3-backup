import { Dynamodb } from '@cloudigniter/next/services/dynamodb/server';
import {
  ciError400,
  ciError500,
  ciNormalizeThrownError,
  ciOk200,
  ciSerializeUnknownError,
  type CiResult,
} from '@cloudigniter/next/core';
import {
  ciWithDdbClient,
  type CiDeleteOrgUnitInterface,
  type CiOrgUnitCommonArgs,
  type CiSystemOrgUnitItem,
} from '@cloudigniter/next/core/server';

import { ciBuildOuPK, ciBuildOuSK } from '../helpers';

/**
 * Maximum number of items allowed in one DynamoDB transaction write.
 */
const CI_DDB_TXN_MAX_ITEMS = 25;

/**
 * Splits an array into fixed-size chunks.
 */
function ciChunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
}

/**
 * Deletes a single organizational unit record.
 *
 * Default behavior:
 * - Prevents deleting non-leaf nodes.
 * - Returns an error when child OUs exist.
 *
 * Forced behavior:
 * - When `forceDeleteTree === true`, deletes the target OU and all descendants.
 *
 * Notes:
 * - All OUs for a tenant share the same PK.
 * - Descendants are identified by sort key prefix `${SK}/`.
 *
 * Implementation notes:
 * - Uses the CloudIgniter `Dynamodb` wrapper
 * - Uses Result-style responses only
 */
export async function ciDeleteOrgUnit(
  args: CiOrgUnitCommonArgs & { input: CiDeleteOrgUnitInterface }
): Promise<CiResult<CiSystemOrgUnitItem | { deletedRoot: CiSystemOrgUnitItem; deletedCount: number }>> {
  const { tableName, clientConfig, input } = args;
  const { tenantId, path, forceDeleteTree = false } = input;

  const ddb = new Dynamodb(clientConfig);

  try {
    return await ciWithDdbClient(ddb, async () => {
      const PK = ciBuildOuPK(tenantId);
      const SK = ciBuildOuSK(path);
      const descendantPrefix = `${SK}/`;

      const descendantsQuery = await ddb.queryItems<CiSystemOrgUnitItem>({
        TableName: tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': PK,
          ':skPrefix': descendantPrefix,
        },
      });

      if (!descendantsQuery.ok) {
        return ciError500(
          descendantsQuery.body.error || 'ORG_UNIT_DELETE: Failed to query child organizational units.',
          descendantsQuery.body.details
        );
      }

      const descendants = descendantsQuery.body.items;

      if (descendants.length > 0 && !forceDeleteTree) {
        return ciError400(
          `ORG_UNIT_DELETE: OrgUnit "${path}" for tenant "${tenantId}" has child organizational units. Pass forceDeleteTree=true to delete the full tree.`,
          {
            childCount: descendants.length,
          }
        );
      }

      if (!forceDeleteTree) {
        const deleted = await ddb.deleteItem<CiSystemOrgUnitItem, { PK: string; SK: string }>({
          tableName,
          key: { PK, SK },
          existence: 'deleteOnly',
          returnValues: 'ALL_OLD',
        });

        if (!deleted.ok) {
          if (deleted.statusCode === 400) {
            return ciError400(`ORG_UNIT_DELETE: OrgUnit "${path}" not found for tenant "${tenantId}".`);
          }

          return ciError500(
            deleted.body.error || 'ORG_UNIT_DELETE: Failed to delete organizational unit.',
            deleted.body.details
          );
        }

        if (!deleted.body.attributes) {
          return ciError400(`ORG_UNIT_DELETE: OrgUnit "${path}" not found for tenant "${tenantId}".`);
        }

        return ciOk200(deleted.body.attributes);
      }

      const rootRead = await ddb.readItem<CiSystemOrgUnitItem, { PK: string; SK: string }>({
        tableName,
        key: { PK, SK },
      });

      if (!rootRead.ok) {
        return ciError500(
          rootRead.body.error || 'ORG_UNIT_DELETE: Failed to read target organizational unit before tree deletion.',
          rootRead.body.details
        );
      }

      if (!rootRead.body.item) {
        return ciError400(`ORG_UNIT_DELETE: OrgUnit "${path}" not found for tenant "${tenantId}".`);
      }

      const deleteKeys = [
        ...descendants.map((item: CiSystemOrgUnitItem) => ({
          PK: item.PK,
          SK: item.SK,
        })),
        { PK, SK },
      ];

      const deleteChunks = ciChunkArray(deleteKeys, CI_DDB_TXN_MAX_ITEMS);

      for (const chunk of deleteChunks) {
        const tx = await ddb.transactWrite({
          tableName,
          items: chunk.map((key) => ({
            mode: 'delete' as const,
            key,
            existence: 'deleteOnly' as const,
          })),
        });

        if (!tx.ok) {
          return ciError500(
            tx.body.error || 'ORG_UNIT_DELETE: Failed to delete organizational unit tree.',
            tx.body.details
          );
        }
      }

      return ciOk200({
        deletedRoot: rootRead.body.item,
        deletedCount: deleteKeys.length,
      });
    });
  } catch (error) {
    const ciError = ciNormalizeThrownError(error);

    return ciError500(
      ciError.message || 'ORG_UNIT_DELETE: Unexpected error while deleting organizational unit.',
      ciSerializeUnknownError(error)
    );
  } finally {
    ddb.destroy();
  }
}
